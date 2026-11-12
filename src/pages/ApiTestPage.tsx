/**
 * API System Test Page
 * Verifies all backend services are working correctly
 */

import { useState, useEffect } from "react";
import { SanatanMargaApi, useApi, useAuth, useFeature } from "@/src/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { Separator } from "@/src/components/ui/Separator";
import { Check, X, Loader2, AlertCircle, Info } from "lucide-react";

export default function ApiTestPage() {
  const api = useApi();
  const { user, loading: authLoading } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    setTests([]);

    const testCases: TestCase[] = [
      { name: "Health Check", fn: () => api.healthCheck() },
      { name: "Database - Read Articles", fn: () => api.db.getDocs("articles", [api.db.limit(5)]) },
      { name: "Database - Read Categories", fn: () => api.db.getDocs("categories") },
      { name: "Database - Write/Delete Test", fn: async () => {
        const ref = await api.db.addDoc("test_collection", { test: true, timestamp: Date.now() });
        await api.db.deleteDoc(ref);
        return { success: true };
      }},
      { name: "Storage - Upload/Download", fn: async () => {
        const blob = new Blob(["test content"], { type: "text/plain" });
        const result = await api.storage.upload("test/test.txt", blob);
        const downloaded = await api.storage.download(result.path);
        await api.storage.delete(result.path);
        return { size: downloaded.size };
      }},
      { name: "AI - Generate Text", fn: () => api.ai.generateText("Say hello in Nepali", { maxTokens: 50 }) },
      { name: "AI - Quota Status", fn: () => api.ai.getQuotaStatus() },
      { name: "Snapshots - Homepage", fn: () => api.snapshots.getHomepageSnapshot() },
      { name: "Snapshots - Manifest", fn: () => api.snapshots.getManifest() },
      { name: "Auth - Current User", fn: () => api.auth.getCurrentUser() },
      { name: "Features - Get All States", fn: () => api.features.getAllStates() },
    ];

    const results: TestResult[] = [];
    for (const tc of testCases) {
      const start = Date.now();
      try {
        const result = await tc.fn();
        results.push({
          name: tc.name,
          status: "pass",
          duration: Date.now() - start,
          data: result,
        });
      } catch (error: any) {
        results.push({
          name: tc.name,
          status: "fail",
          duration: Date.now() - start,
          error: error.message,
        });
      }
      setTests([...results]);
    }

    const healthCheck = await api.healthCheck();
    setHealth(healthCheck);
    setRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border-theme bg-card sticky top-0 z-50">
        <div className="container-custom px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-card-foreground">API System Test</h1>
          <div className="flex items-center gap-3">
            <Badge variant={health?.status === "healthy" ? "success" : health?.status === "degraded" ? "warning" : "destructive"}>
              {health?.status?.toUpperCase() || "UNKNOWN"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container-custom py-8 px-4">
        <div className="mb-6 flex flex-wrap gap-3">
          <Button onClick={runTests} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Run All Tests</>}
          </Button>
          <Button variant="outline" onClick={() => window.open("/admin/feature-control", "_blank")}>
            <Info className="w-4 h-4 mr-2" /> Feature Control
          </Button>
        </div>

        {health && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" /> System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(health.services).map(([service, status]) => (
                  <div key={service} className="p-3 rounded-xl bg-muted-area/50">
                    <div className="text-sm font-bold text-muted-text">{service}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={status ? "success" : "destructive"} className="text-xs">
                        {status ? "OK" : "FAIL"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-card-foreground">Test Results</h2>
          {tests.map((test) => (
            <Card key={test.name} className={test.status === "pass" ? "border-green-500/20" : "border-red-500/20"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {test.status === "pass" ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium text-card-foreground">{test.name}</span>
                    <Badge variant={test.status === "pass" ? "success" : "destructive"}>
                      {test.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-text">{test.duration}ms</span>
                </div>
                {test.error && (
                  <div className="mt-2 p-2 bg-red-500/10 text-red-500 text-sm rounded font-mono">
                    {test.error}
                  </div>
                )}
                {test.data && !test.error && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-text cursor-pointer">View Response</summary>
                    <pre className="mt-2 p-2 bg-muted-area rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(test.data, null, 2).slice(0, 2000)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {tests.length === 0 && !running && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-text mx-auto mb-4" />
              <p className="text-muted-text">No tests run yet. Click "Run All Tests" to start.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

interface TestResult {
  name: string;
  status: "pass" | "fail";
  duration: number;
  data?: any;
  error?: string;
}

interface TestCase {
  name: string;
  fn: () => Promise<any> | any;
}