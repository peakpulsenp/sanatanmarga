// Ambient declarations for externalized/optional cloud SDKs
declare module "firebase/app" {
  export const initializeApp: any;
  export const getApps: any;
  export const getApp: any;
}

declare module "firebase/auth" {
  export const getAuth: any;
  export const connectAuthEmulator: any;
  export const setPersistence: any;
  export const browserLocalPersistence: any;
  export const signInWithEmailAndPassword: any;
  export const createUserWithEmailAndPassword: any;
  export const signInWithPopup: any;
  export const signOut: any;
  export const updateProfile: any;
  export const sendEmailVerification: any;
  export const onAuthStateChanged: any;
  export const GoogleAuthProvider: any;
  export const FacebookAuthProvider: any;
  export const TwitterAuthProvider: any;
  export const GithubAuthProvider: any;
  export const MicrosoftAuthProvider: any;
  export const AppleAuthProvider: any;
  export const YahooAuthProvider: any;
}

declare module "firebase/firestore" {
  export const getFirestore: any;
  export const connectFirestoreEmulator: any;
  export const doc: any;
  export const collection: any;
  export const getDoc: any;
  export const getDocs: any;
  export const setDoc: any;
  export const updateDoc: any;
  export const deleteDoc: any;
  export const addDoc: any;
  export const query: any;
  export const where: any;
  export const orderBy: any;
  export const limit: any;
  export const limitToLast: any;
  export const startAt: any;
  export const startAfter: any;
  export const endAt: any;
  export const endBefore: any;
  export const runTransaction: any;
  export const writeBatch: any;
  export const onSnapshot: any;
  export const listCollections: any;
  export const getCountFromServer: any;
  export const Timestamp: any;
}

declare module "firebase/storage" {
  export const getStorage: any;
  export const connectStorageEmulator: any;
  export const ref: any;
  export const uploadBytesResumable: any;
  export const uploadBytes: any;
  export const getDownloadURL: any;
  export const getMetadata: any;
  export const updateMetadata: any;
  export const deleteObject: any;
  export const listAll: any;
}

declare module "firebase/messaging" {
  export const getMessaging: any;
  export const getToken: any;
  export const onMessage: any;
}

declare module "@aws-sdk/signature-v4" {
  export const Signer: any;
}

declare module "@aws-crypto/sha256-js" {
  export const Sha256: any;
}

declare module "@aws-sdk/credential-provider-node" {
  export const defaultProvider: any;
}

declare module "@aws-sdk/client-s3" {
  export const S3Client: any;
  export const PutObjectCommand: any;
  export const GetObjectCommand: any;
  export const HeadObjectCommand: any;
  export const DeleteObjectCommand: any;
  export const DeleteObjectsCommand: any;
  export const ListObjectsV2Command: any;
  export const CopyObjectCommand: any;
  export const createMultipartUpload: any;
  export const uploadPart: any;
  export const completeMultipartUpload: any;
}

declare module "@aws-sdk/s3-request-presigner" {
  export const getSignedUrl: any;
}
