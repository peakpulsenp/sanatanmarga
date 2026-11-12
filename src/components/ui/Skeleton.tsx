import { cn } from "@/src/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer bg-slate-200 animate-pulse rounded-xl", className)}
      {...props}
    />
  );
}
