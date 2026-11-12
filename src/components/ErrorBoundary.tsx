import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home, Zap } from "lucide-react";
import { recoverFirestore } from "@/src/lib/firebase";
import { captureException } from "@/src/lib/sentry";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    captureException(error, errorInfo);
  }

  private handleRepair = async () => {
    await recoverFirestore();
  };

  public render() {
    if (this.state.hasError) {
      const isFirestoreError = this.state.error?.message?.includes('FIRESTORE') || this.state.error?.stack?.includes('firestore');

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-3xl font-black text-card-foreground tracking-tight mb-2">केही गलत भयो</h1>
          <p className="text-muted-text font-medium max-w-md mb-8">
            अनुप्रयोगमा प्राविधिक त्रुटि देखा पर्यो। कृपया पृष्ठ पुन: लोड गर्नुहोस् वा गृहपृष्ठमा जानुहोस्।
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isFirestoreError ? (
              <button
                onClick={this.handleRepair}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
              >
                <Zap size={18} /> मर्मत र पुन: लोड (Repair)
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                <RefreshCw size={18} /> पुन: लोड गर्नुहोस्
              </button>
            )}
            <a
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-muted-area text-card-foreground rounded-2xl font-black uppercase tracking-widest text-sm border border-border-theme hover:bg-muted-area/80 transition-all"
            >
              <Home size={18} /> गृहपृष्ठ
            </a>
          </div>
          {(import.meta as any).env?.DEV && (
            <div className="mt-12 p-4 bg-muted-area border border-border-theme rounded-xl text-left max-w-2xl overflow-auto">
              <p className="text-xs font-mono text-red-500 mb-2 font-bold">{this.state.error?.toString()}</p>
              <p className="text-[10px] font-mono text-muted-text whitespace-pre">
                {this.state.error?.stack}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
