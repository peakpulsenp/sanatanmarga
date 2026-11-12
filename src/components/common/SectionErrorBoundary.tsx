import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

/**
 * SectionErrorBoundary isolates individual homepage widgets and sections
 * so a WebKit or runtime error in one subsystem does not break the entire page.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(
      `[SectionErrorBoundary] Handled non-fatal error in section "${this.props.sectionName || 'homepage-section'}":`,
      error,
      errorInfo
    );
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export default SectionErrorBoundary;
