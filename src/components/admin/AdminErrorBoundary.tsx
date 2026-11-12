import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  moduleName?: string;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export default class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Admin Module Error]", {
      module: this.props.moduleName || "unknown",
      error: error.message,
      errorInfo
    });
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-card border border-rose-500/20 rounded-2xl shadow-xl space-y-5 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-card-foreground">
              {this.props.moduleName ? `${this.props.moduleName} लोड गर्न सकिएन` : "Admin Module Error"}
            </h2>
            <p className="text-xs text-muted-text">
              यस मोड्युलमा अप्रत्याशित समस्या देखियो। तपाईंको नेभिगेसन र अन्य मोड्युलहरू सुरक्षित छन्।
            </p>
          </div>

          {this.state.errorId && (
            <div className="p-3 bg-muted-area/50 rounded-xl border border-border-theme text-[11px] font-mono text-muted-text flex items-center justify-between">
              <span>Error Trace ID:</span>
              <span className="font-bold text-foreground">{this.state.errorId}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>पुनः प्रयास गर्नुहोस् (Retry)</span>
            </button>

            <a
              href={this.props.fallbackRoute || "/admin"}
              className="px-4 py-2 bg-muted-area hover:bg-muted-area/80 text-foreground border border-border-theme rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>कमान्ड सेन्टर फर्कनुहोस्</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
