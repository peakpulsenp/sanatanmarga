import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Tenant } from '@/src/types';
import { db, getDocsWithCacheFallback, collection, doc, setDoc, deleteDoc, updateDoc } from './firebase';

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: "sanatan-media",
    slug: "sanatan-media",
    enabledModules: ["news", "community", "academy", "knowledge", "events", "store", "media", "radio", "revenue"],
    configurationVersion: 1,
    tenantSecurityVersion: 1,
    name: "सनातन मिडिया मुख्य कार्यालय (Sanatan Media Core)",
    code: "SANATAN_MEDIA",
    type: "media",
    status: "active",
    subdomain: "media",
    customDomain: "sanatanmarga.com",
    ownerUid: "system-admin",
    ownerEmail: "admin@sanatanmarga.com",
    ownerName: "सनातन प्रबन्ध मण्डल",
    modules: [
      { id: "editorial_cms", name: "Editorial CMS", enabled: true, version: "2.5" },
      { id: "ai_newsroom", name: "Search-Grounded AI Co-pilot", enabled: true, version: "3.0" },
      { id: "community_chautari", name: "Chautari Community Forum", enabled: true, version: "2.1" },
      { id: "revenue_os", name: "Sponsorship & Revenue OS", enabled: true, version: "2.0" },
      { id: "knowledge_graph", name: "Saraswati Knowledge OS", enabled: true, version: "1.0" }
    ],
    settings: {
      primaryColor: "#d97706",
      logoUrl: "/logo.svg",
      timeZone: "Asia/Kathmandu",
      languageDefault: "np",
      allowPublicRegistration: true
    },
    billing: {
      plan: "enterprise",
      monthlyRateNpr: 250000,
      status: "paid",
      nextBillingDate: "2026-12-31"
    },
    stats: {
      totalUsers: 12800,
      activeArticles: 4850,
      mrrNpr: 250000
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "sanskrit-gurukul",
    slug: "sanskrit-gurukul",
    enabledModules: ["knowledge", "community", "news"],
    configurationVersion: 1,
    tenantSecurityVersion: 1,
    name: "नेपाल संस्कृत गुरुकुल महाविद्यालय",
    code: "SANSKRIT_GURUKUL",
    type: "school",
    status: "active",
    subdomain: "gurukul",
    customDomain: "sanskritgurukul.edu.np",
    ownerUid: "gurukul-principal",
    ownerEmail: "principal@sanskritgurukul.edu.np",
    ownerName: "अचार्य राघवेन्द्र शास्त्री",
    modules: [
      { id: "knowledge_graph", name: "Saraswati Knowledge OS", enabled: true, version: "1.0" },
      { id: "community_chautari", name: "Gurukul Forum", enabled: true, version: "2.1" },
      { id: "editorial_cms", name: "Journal CMS", enabled: true, version: "2.5" }
    ],
    settings: {
      primaryColor: "#059669",
      logoUrl: "",
      timeZone: "Asia/Kathmandu",
      languageDefault: "np",
      allowPublicRegistration: false
    },
    billing: {
      plan: "institutional",
      monthlyRateNpr: 45000,
      status: "paid",
      nextBillingDate: "2026-11-15"
    },
    stats: {
      totalUsers: 1420,
      activeArticles: 620,
      mrrNpr: 45000
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "pokhara-municipality",
    slug: "pokhara-municipality",
    enabledModules: ["news", "community", "revenue"],
    configurationVersion: 1,
    tenantSecurityVersion: 1,
    name: "पोखरा महानगरपालिका साँस्कृतिक महाशाखा",
    code: "POKHARA_MUN",
    type: "municipality",
    status: "active",
    subdomain: "pokhara-culture",
    customDomain: "culture.pokharamun.gov.np",
    ownerUid: "pokhara-admin",
    ownerEmail: "culture@pokharamun.gov.np",
    ownerName: "सूचना तथा संस्कृति अधिकारी",
    modules: [
      { id: "editorial_cms", name: "Municipal Portal", enabled: true, version: "2.5" },
      { id: "community_chautari", name: "Nagarik Chautari", enabled: true, version: "2.1" },
      { id: "revenue_os", name: "Sponsorship & Permits", enabled: true, version: "2.0" }
    ],
    settings: {
      primaryColor: "#2563eb",
      logoUrl: "",
      timeZone: "Asia/Kathmandu",
      languageDefault: "np",
      allowPublicRegistration: true
    },
    billing: {
      plan: "enterprise",
      monthlyRateNpr: 120000,
      status: "paid",
      nextBillingDate: "2026-10-01"
    },
    stats: {
      totalUsers: 28400,
      activeArticles: 1920,
      mrrNpr: 120000
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "janakpur-hospital",
    slug: "janakpur-hospital",
    enabledModules: ["news", "knowledge"],
    configurationVersion: 1,
    tenantSecurityVersion: 1,
    name: "जनकपुरधाम आयुर्वेद तथा जनकल्याण प्रतिष्ठान",
    code: "JANAKPUR_AYURVEDA",
    type: "hospital",
    status: "active",
    subdomain: "janakpur-ayurveda",
    customDomain: "janakpurayurveda.org.np",
    ownerUid: "janakpur-med",
    ownerEmail: "info@janakpurayurveda.org.np",
    ownerName: "डा. रामेश्वर मिश्र",
    modules: [
      { id: "knowledge_graph", name: "Ayurveda Herb Registry", enabled: true, version: "1.0" },
      { id: "editorial_cms", name: "Health Bulletins", enabled: true, version: "2.5" }
    ],
    settings: {
      primaryColor: "#7c3aed",
      logoUrl: "",
      timeZone: "Asia/Kathmandu",
      languageDefault: "np",
      allowPublicRegistration: true
    },
    billing: {
      plan: "starter",
      monthlyRateNpr: 25000,
      status: "paid",
      nextBillingDate: "2026-09-30"
    },
    stats: {
      totalUsers: 890,
      activeArticles: 310,
      mrrNpr: 25000
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

interface TenantContextType {
  activeTenant: Tenant;
  allTenants: Tenant[];
  switchTenant: (tenantId: string) => void;
  addNewTenant: (tenant: Partial<Tenant>) => Promise<void>;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  toggleTenantModule: (tenantId: string, moduleId: string) => Promise<void>;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  activeTenant: DEFAULT_TENANTS[0],
  allTenants: DEFAULT_TENANTS,
  switchTenant: () => {},
  addNewTenant: async () => {},
  updateTenant: async () => {},
  deleteTenant: async () => {},
  toggleTenantModule: async () => {},
  isLoading: false
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [allTenants, setAllTenants] = useState<Tenant[]>(() => 
    DEFAULT_TENANTS.filter(t => t.type !== "school" && t.type !== "municipality" && t.type !== "hospital")
  );
  const [activeTenant, setActiveTenant] = useState<Tenant>(() => {
    const savedId = localStorage.getItem('sutra_active_tenant_id');
    const filteredDefaults = DEFAULT_TENANTS.filter(t => t.type !== "school" && t.type !== "municipality" && t.type !== "hospital");
    const found = filteredDefaults.find(t => t.id === savedId);
    return found || filteredDefaults[0];
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        const qSnap = await getDocsWithCacheFallback(collection(db, "tenants"), "tenant_list");
        if (!qSnap.empty) {
          const dbTenants: Tenant[] = [];
          qSnap.forEach(docSnap => {
            dbTenants.push({ id: docSnap.id, ...docSnap.data() } as Tenant);
          });
          // Merge default core tenant if missing
          const hasCore = dbTenants.some(t => t.id === "sanatan-media");
          const merged = hasCore ? dbTenants : [DEFAULT_TENANTS[0], ...dbTenants];
          const filtered = merged.filter(t => t.type !== "school" && t.type !== "municipality" && t.type !== "hospital");
          setAllTenants(filtered);

          const savedId = localStorage.getItem('sutra_active_tenant_id');
          if (savedId) {
            const current = filtered.find(t => t.id === savedId);
            if (current) setActiveTenant(current);
          }
        }
      } catch (err) {
        console.warn("Tenant sync falling back to default federation list:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  // SEC-05: switchTenant controls client-side UI rendering perspective only.
  // Client localStorage state is NEVER trusted as authorization authority on the server.
  // Privileged actions validate authenticated user credentials & membership server-side.
  const switchTenant = useCallback((tenantId: string) => {
    const target = allTenants.find(t => t.id === tenantId);
    if (target) {
      const prevId = activeTenant?.id;
      if (prevId && prevId !== target.id) {
        // Enforce cache isolation across workspace switches
        try {
          const prefix = `tenant_cache_${prevId}_`;
          for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(prefix)) {
              sessionStorage.removeItem(k);
            }
          }
        } catch (e) {}
      }
      setActiveTenant(target);
      localStorage.setItem('sutra_active_tenant_id', target.id);
    }
  }, [allTenants, activeTenant]);

  const addNewTenant = useCallback(async (tenantData: Partial<Tenant>) => {
    const newId = tenantData.id || `tenant-${Date.now()}`;
    const newTenant: Tenant = {
      id: newId,
      slug: tenantData.slug || newId,
      enabledModules: tenantData.enabledModules || ["news", "community"],
      configurationVersion: tenantData.configurationVersion || 1,
      tenantSecurityVersion: tenantData.tenantSecurityVersion || 1,
      name: tenantData.name || "नयाँ संस्थागत टेनान्ट",
      code: tenantData.code || "NEW_TENANT",
      type: tenantData.type || "media",
      status: tenantData.status || "active",
      subdomain: tenantData.subdomain || newId,
      customDomain: tenantData.customDomain || "",
      ownerUid: tenantData.ownerUid || "admin",
      ownerEmail: tenantData.ownerEmail || "admin@institution.org",
      ownerName: tenantData.ownerName || "संस्थापक प्रमुख",
      modules: tenantData.modules || [
        { id: "editorial_cms", name: "Editorial CMS", enabled: true, version: "2.5" },
        { id: "community_chautari", name: "Community Forum", enabled: true, version: "2.1" }
      ],
      settings: tenantData.settings || {
        primaryColor: "#d97706",
        timeZone: "Asia/Kathmandu",
        languageDefault: "np",
        allowPublicRegistration: true
      },
      billing: tenantData.billing || {
        plan: "institutional",
        monthlyRateNpr: 35000,
        status: "paid",
        nextBillingDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      },
      stats: {
        totalUsers: 1,
        activeArticles: 0,
        mrrNpr: 35000
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "tenants", newId), newTenant);
    } catch (e) {
      console.warn("Failed saving tenant to Firestore, keeping local state:", e);
    }

    setAllTenants(prev => [newTenant, ...prev]);
    setActiveTenant(newTenant);
    localStorage.setItem('sutra_active_tenant_id', newId);
  }, []);

  const updateTenant = useCallback(async (tenantId: string, updates: Partial<Tenant>) => {
    const updatedAt = new Date().toISOString();
    const updatedPayload = { ...updates, updatedAt };

    try {
      await updateDoc(doc(db, "tenants", tenantId), updatedPayload);
    } catch (e) {
      console.warn("Failed updating tenant in Firestore, updating local state:", e);
    }

    setAllTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updatedPayload } as Tenant : t));
    setActiveTenant(prev => prev.id === tenantId ? ({ ...prev, ...updatedPayload } as Tenant) : prev);
  }, []);

  const deleteTenant = useCallback(async (tenantId: string) => {
    if (tenantId === "sanatan-media") {
      throw new Error("Cannot delete core master tenant");
    }

    try {
      await deleteDoc(doc(db, "tenants", tenantId));
    } catch (e) {
      console.warn("Failed deleting tenant from Firestore:", e);
    }

    setAllTenants(prev => prev.filter(t => t.id !== tenantId));
    setActiveTenant(prev => {
      if (prev.id === tenantId) {
        const fallback = DEFAULT_TENANTS[0];
        localStorage.setItem('sutra_active_tenant_id', fallback.id);
        return fallback;
      }
      return prev;
    });
  }, []);

  const toggleTenantModule = useCallback(async (tenantId: string, moduleId: string) => {
    const targetTenant = allTenants.find(t => t.id === tenantId);
    if (!targetTenant) return;

    const updatedModules = (targetTenant.modules || []).map(m => 
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    );

    await updateTenant(tenantId, { modules: updatedModules });
  }, [allTenants, updateTenant]);

  const value = useMemo(() => ({
    activeTenant, 
    allTenants, 
    switchTenant, 
    addNewTenant, 
    updateTenant, 
    deleteTenant, 
    toggleTenantModule, 
    isLoading 
  }), [
    activeTenant, 
    allTenants, 
    switchTenant, 
    addNewTenant, 
    updateTenant, 
    deleteTenant, 
    toggleTenantModule, 
    isLoading 
  ]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
