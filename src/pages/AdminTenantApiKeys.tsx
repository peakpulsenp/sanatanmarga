import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useTenant } from "@/src/lib/tenantContext";
import { DeveloperApiKey, DeveloperApiKeyScope } from "@/src/types/developer";
import { clientDeveloperOS } from "@/src/services/developerOS";
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Terminal, 
  Trash2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export default function AdminTenantApiKeys() {
  const { activeTenant } = useTenant();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<DeveloperApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await clientDeveloperOS.getApiKeys(activeTenant.id);
    if (res.success) {
      setApiKeys(res.apiKeys);
    } else {
      setErrorMsg(res.error || "Failed loading API keys");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, [activeTenant.id]);

  const handleCopy = (keyText: string, id: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = async () => {
    const name = prompt("नयाँ API कुञ्जीको नाम राख्नुहोस् (e.g. Partner Portal Sync):");
    if (!name) return;

    const scopesPrompt = prompt(
      "प्रवेश अधिकार (Scopes) अल्पविरामले छुट्याउनुहोस् (Comma separated):\n\nउपलब्ध: articles:read, articles:write, knowledge:query, community:read, community:write, analytics:read, fcm:push, webhooks:manage, telemetry:read",
      "articles:read, knowledge:query"
    );

    const scopes = (scopesPrompt || "articles:read, knowledge:query")
      .split(",")
      .map(s => s.trim()) as DeveloperApiKeyScope[];

    const res = await clientDeveloperOS.createApiKey(activeTenant.id, {
      name,
      scopes
    });

    if (res.success && res.rawSecret) {
      setNewlyCreatedSecret(res.rawSecret);
      await loadKeys();
    } else {
      alert(`API Key सिर्जना असफल भयो: ${res.error || "Unknown error"}`);
    }
  };

  const handleRevoke = async (id: string) => {
    if (confirm("के तपाईं यो API Key निष्क्रिय (Revoke) गर्न चाहनुहुन्छ?")) {
      const res = await clientDeveloperOS.revokeApiKey(activeTenant.id, id);
      if (res.success) {
        await loadKeys();
      } else {
        alert(`Revoke असफल भयो: ${res.error}`);
      }
    }
  };

  const handleRotate = async (id: string) => {
    if (confirm("के तपाईं यो API Key लाई नयाँ कुञ्जीमा Rotate गर्न चाहनुहुन्छ?")) {
      const res = await clientDeveloperOS.rotateApiKey(activeTenant.id, id);
      if (res.success && res.newRawSecret) {
        setNewlyCreatedSecret(res.newRawSecret);
        await loadKeys();
      } else {
        alert(`Key rotation असफल भयो: ${res.error}`);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                DEVELOPER API PLATFORM V1.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-muted-area text-xs font-bold border border-border-theme font-mono">
                {activeTenant.code} REST/GraphQL
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-card-foreground mt-1">
              विकासकर्ता API तथा एकीकरण कमान्ड (Developer API Keys)
            </h1>
            <p className="text-xs md:text-sm text-muted-text mt-1">
              साझेदार संस्थाहरू, मोबाइल एप्स र तेस्रो-पक्ष सेवाहरूसँग सुरक्षित डेटा आदानप्रदान।
            </p>
          </div>

          <button
            onClick={handleCreateKey}
            className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md"
          >
            <Plus size={16} /> नयाँ API Key सिर्जना गर्नुहोस्
          </button>
        </div>

        {/* SECRET ALERT MODAL / BANNER IF JUST CREATED */}
        {newlyCreatedSecret && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-card-foreground space-y-3">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <AlertCircle size={18} />
              <span>नयाँ API Secret Key उत्पन्न भएको छ (यो गोप्य साँचो पुनः देखिने छैन):</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="p-3 rounded-xl bg-card border border-border-theme font-mono text-xs font-bold text-primary flex-1 overflow-x-auto">
                {newlyCreatedSecret}
              </code>
              <button
                onClick={() => handleCopy(newlyCreatedSecret, "secret-key")}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1"
              >
                {copiedId === "secret-key" ? <Check size={14} /> : <Copy size={14} />}
                <span>कपी गर्नुहोस्</span>
              </button>
              <button
                onClick={() => setNewlyCreatedSecret(null)}
                className="px-3 py-2 rounded-xl bg-muted-area text-muted-text font-bold text-xs hover:text-card-foreground"
              >
                बन्द गर्नुहोस्
              </button>
            </div>
          </div>
        )}

        {/* API CODE SNIPPET PREVIEW */}
        <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <h3 className="font-black text-card-foreground text-sm flex items-center gap-2">
              <Terminal size={18} className="text-primary" /> API Request Header Example
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600">HTTPS REST v1</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto">
            <div className="text-emerald-400"># Fetch Latest Articles for {activeTenant.name}</div>
            <div>curl -X GET "https://api.sutraos.np/v1/articles" \</div>
            <div className="text-amber-300">  -H "Authorization: Bearer sk_sutra_live_9a8f27163c4e9102" \</div>
            <div>  -H "X-Tenant-Code: {activeTenant.code}"</div>
          </div>
        </div>

        {/* KEYS LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-card-foreground text-lg flex items-center gap-2">
              <Key size={20} className="text-primary" /> सक्रिय API कुञ्जीहरू (Provisioned Access Keys)
            </h3>
            {loading && <span className="text-xs font-bold text-muted-text animate-pulse">प्रक्रियामा छ...</span>}
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="bg-card border border-border-theme rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-card-foreground text-base">{key.keyName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      key.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                    }`}>
                      {key.status === "ACTIVE" ? "सक्रिय" : key.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-muted-area px-3 py-1.5 rounded-xl border border-border-theme text-primary">
                      {key.keyPrefix}...
                    </span>
                    <button
                      onClick={() => handleCopy(key.keyPrefix, key.id)}
                      className="p-1.5 rounded-lg bg-muted-area hover:bg-border-theme text-muted-text hover:text-card-foreground transition-all"
                      title="Copy Key Prefix"
                    >
                      {copiedId === key.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {key.scopes.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-muted-area text-[10px] font-mono text-muted-text border border-border-theme">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 text-xs text-muted-text border-t md:border-t-0 pt-3 md:pt-0 border-border-theme/40">
                  <span className="font-mono font-bold text-card-foreground">
                    आज अनुरोधहरू: {key.requestsCountToday?.toLocaleString() || 0}
                  </span>
                  <span>अन्तिम प्रयोग: {key.lastUsedAt || "अहिलेसम्म प्रयोग नभएको"}</span>

                  {key.status === "ACTIVE" && (
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => handleRotate(key.id)}
                        className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Key Rotate गर्नुहोस्
                      </button>
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="text-rose-500 hover:text-rose-600 font-bold text-xs flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Key Revoke गर्नुहोस्
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!loading && apiKeys.length === 0 && (
              <div className="p-8 text-center bg-card border border-border-theme rounded-3xl text-muted-text text-sm">
                कुनै API Key फेला परेन। नयाँ API Key सिर्जना गर्नुहोस्।
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
