import React from "react";
import { Link } from "react-router-dom";
import { Eye, RefreshCw, Filter, Search } from "lucide-react";

interface AuditArticleTableProps {
  loading: boolean;
  articles: any[];
  snapshotArticles: any[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
}

export default function AuditArticleTable({
  loading,
  articles,
  snapshotArticles,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: AuditArticleTableProps) {
  return (
    <div className="space-y-4">
      <div className="border border-border-theme bg-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="शीर्षक वा क्याटोगोरी खोज्नुहोस्..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted-area border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-muted-text" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-xs focus:outline-none focus:border-primary"
          >
            <option value="all">सबै स्थिति (All Status)</option>
            <option value="published">प्रकाशित (Published)</option>
            <option value="draft">ड्राफ्ट (Draft)</option>
            <option value="restored">पुनर्स्थापित (Restored/Approved)</option>
          </select>
        </div>
      </div>

      <div className="border border-border-theme bg-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-area/50 border-b border-border-theme text-[11px] font-black uppercase text-muted-text">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">शीर्षक (Title)</th>
                <th className="p-4">क्याटोगोरी</th>
                <th className="p-4">स्थिति (Status)</th>
                <th className="p-4">Snapshot OS</th>
                <th className="p-4 text-right">कार्य</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-text">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    सामग्री जाँच हुँदैछ...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-text">
                    कुनै समाचार भेटिएन।
                  </td>
                </tr>
              ) : (
                articles.map((art, idx) => {
                  const isPublished = art.status === "published" || !art.status || art.status === "approved" || art.status === "active";
                  const inSnapshot = snapshotArticles.some(s => s.id === art.id || s.title === art.title);

                  return (
                    <tr key={art.id || idx} className="hover:bg-muted-area/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-muted-text">{idx + 1}</td>
                      <td className="p-4 font-bold text-card-foreground max-w-xs truncate">
                        {art.title}
                      </td>
                      <td className="p-4 text-muted-text">
                        <span className="px-2 py-0.5 rounded-md bg-muted-area text-[10px] font-bold">
                          {art.categoryName || art.categoryId || art.category || "general"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          isPublished 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          {art.status || "published"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          inSnapshot ? "bg-blue-500/10 text-blue-500" : "bg-zinc-500/10 text-zinc-500"
                        }`}>
                          {inSnapshot ? "✓ Cached in Feed" : "Direct DB"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/article/${art.id}`}
                          className="p-2 rounded-lg hover:bg-muted-area text-primary inline-flex items-center"
                          title="हेर्नुहोस्"
                        >
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
