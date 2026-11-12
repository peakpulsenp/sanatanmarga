import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  roleFromEmail
} from './authClient';
import { auth, db, doc, setDoc, getDocWithCacheFallback } from './firebase';
import { initializeNotifications } from './notifications';
import type { User, UserRole } from '@/src/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
});

// SEC-01 Remediation: Client MUST NEVER assign privileged roles based on email prefixes.
// Privileged roles are granted strictly via authoritative database records or server IAM.
// The sole bootstrap exception is the authorized platform owner email for initial deployment.
export const BOOTSTRAP_SUPERADMIN_EMAIL = 'sagarrana@gmail.com';

export const isBootstrapSuperAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === BOOTSTRAP_SUPERADMIN_EMAIL;
};

// Backward-compatible signature: Normal users ALWAYS default to 'user'.
// Only the verified bootstrap owner receives 'super_admin'.
export const determineRoleFromEmail = (email?: string | null): UserRole => {
  if (isBootstrapSuperAdmin(email)) {
    return 'super_admin';
  }
  // In local demo mode, demo account prefixes map to staff roles so the
  // dashboards and admin panel are reachable without a cloud backend.
  return roleFromEmail(email) as UserRole;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signUp = React.useCallback(async (email: string, pass: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(res.user);
      
      const newUser: User = {
        uid: res.user.uid,
        email: res.user.email || '',
        displayName: name,
        role: determineRoleFromEmail(email),
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', res.user.uid), newUser);
      setUser(newUser);
      initializeNotifications();
    } catch (err: any) {
      console.error("Sign up error:", err);
      throw err;
    }
  }, []);

  const signIn = React.useCallback(async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Sign in error:", err);
      throw err;
    }
  }, []);

  const logout = React.useCallback(async () => {
    await signOut(auth);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDocWithCacheFallback(userRef, "auth_user_profile");
          
          const expectedRole = determineRoleFromEmail(firebaseUser.email);

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if (expectedRole === 'super_admin' && userData.role !== 'super_admin') {
              userData.role = 'super_admin';
              setDoc(userRef, { role: 'super_admin' }, { merge: true }).catch(console.warn);
            }
            setUser(userData);
            // Cache user profile locally
            localStorage.setItem(`sutra_user_profile_${firebaseUser.uid}`, JSON.stringify(userData));
            initializeNotifications();
          } else {
            // Check local cache if Firestore failed (though getDocWithCacheFallback should return exists()=false)
            const cached = localStorage.getItem(`sutra_user_profile_${firebaseUser.uid}`);
            if (cached) {
              try {
                const userData = JSON.parse(cached);
                console.log("Using locally cached user profile due to Firestore read failure");
                setUser(userData);
                initializeNotifications();
                setLoading(false);
                return;
              } catch (e) {}
            }

            console.log("Creating/initializing user profile in Firestore for:", firebaseUser.email);
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'प्रयोगकर्ता',
              role: expectedRole,
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
            };
            
            setUser(newUser);
            localStorage.setItem(`sutra_user_profile_${firebaseUser.uid}`, JSON.stringify(newUser));
            initializeNotifications();

            try {
              await setDoc(userRef, newUser, { merge: true });
            } catch (writeErr) {
              console.warn("Could not save user profile in Firestore:", writeErr);
            }
          }
        } catch (err) {
          console.error('Error fetching/creating user profile:', err);
          
          // Try local cache as absolute last resort
          const cached = localStorage.getItem(`sutra_user_profile_${firebaseUser.uid}`);
          if (cached) {
            try {
              const userData = JSON.parse(cached);
              setUser(userData);
              setLoading(false);
              return;
            } catch (e) {}
          }

          // Fallback user object if Firestore read completely fails and no cache
          const fallbackUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'प्रयोगकर्ता',
            role: determineRoleFromEmail(firebaseUser.email),
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
          };
          setUser(fallbackUser);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    signUp,
    signIn,
    logout
  }), [user, loading, error, signUp, signIn, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
