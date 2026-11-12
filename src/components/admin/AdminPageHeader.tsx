import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  route: string;
}

export interface AdminAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  statusBadge?: React.ReactNode;
  primaryAction?: AdminAction;
  secondaryActions?: AdminAction[];
  children?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  statusBadge,
  primaryAction,
  secondaryActions,
  children
}: AdminPageHeaderProps) {
  return (
    <div className="border-b border-border-theme pb-5 mb-6 space-y-3">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-text flex-wrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.route + idx}>
                {idx > 0 && <ChevronRight size={12} className="text-muted-text/50 shrink-0" />}
                {isLast ? (
                  <span className="font-semibold text-foreground truncate max-w-[200px]" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.route}
                    className="hover:text-primary transition-colors truncate max-w-[150px]"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-card-foreground tracking-tight">
              {title}
            </h1>
            {statusBadge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-muted-text max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {secondaryActions?.map((act, i) => (
            <button
              key={act.label + i}
              onClick={act.onClick}
              disabled={act.disabled}
              className="px-3 py-1.5 bg-muted-area hover:bg-muted-area/80 text-foreground border border-border-theme rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {act.icon}
              <span>{act.label}</span>
            </button>
          ))}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
