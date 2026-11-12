import { Skeleton } from "./Skeleton";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

export function HomeSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8">
            <Skeleton className="w-full aspect-[4/3] sm:aspect-video rounded-[2rem] sm:rounded-[2.5rem] mb-6 bg-muted-area/30" />
            <Skeleton className="h-10 sm:h-14 w-full sm:w-3/4 mb-4 rounded-xl bg-muted-area/50" />
            <Skeleton className="h-5 sm:h-6 w-1/2 rounded-lg bg-muted-area/20" />
          </div>
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 p-4 bg-card rounded-3xl border border-border-theme shadow-sm">
                <Skeleton className="w-24 h-20 sm:w-32 sm:h-24 rounded-2xl flex-shrink-0 bg-muted-area/30" />
                <div className="flex-grow flex flex-col gap-2">
                  <Skeleton className="h-4 w-24 bg-muted-area/50" />
                  <Skeleton className="h-10 w-full bg-muted-area/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-4 bg-card p-5 sm:p-6 rounded-[2rem] border border-border-theme shadow-sm">
              <Skeleton className="w-full aspect-video rounded-2xl bg-muted-area/30" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-24 rounded-lg bg-muted-area/50" />
                <Skeleton className="h-8 w-full rounded-lg bg-muted-area/30" />
                <Skeleton className="h-6 w-3/4 rounded-lg bg-muted-area/20" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-16 w-full mb-6 rounded-2xl bg-muted-area/50" />
          <Skeleton className="h-12 w-3/4 mb-10 rounded-2xl bg-muted-area/30" />
          <div className="flex items-center gap-4 mb-12 p-6 bg-card rounded-3xl border border-border-theme">
            <Skeleton className="w-16 h-16 rounded-full bg-muted-area/50" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48 rounded-lg bg-muted-area/50" />
              <Skeleton className="h-4 w-32 rounded-lg bg-muted-area/30" />
            </div>
          </div>
          <Skeleton className="w-full aspect-video rounded-[2.5rem] mb-12 bg-muted-area/20" />
          <div className="space-y-6">
            <Skeleton className="h-6 w-full rounded-lg bg-muted-area/30" />
            <Skeleton className="h-6 w-full rounded-lg bg-muted-area/30" />
            <Skeleton className="h-6 w-5/6 rounded-lg bg-muted-area/30" />
            <div className="py-8">
              <Skeleton className="h-px w-full bg-border-theme" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded-lg bg-muted-area/20" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function GridItemsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4 bg-card p-5 sm:p-6 rounded-[2rem] border border-border-theme shadow-sm">
          <Skeleton className="w-full aspect-video rounded-2xl bg-muted-area/30" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-lg bg-muted-area/50" />
            <Skeleton className="h-8 w-full rounded-lg bg-muted-area/30" />
            <Skeleton className="h-6 w-3/4 rounded-lg bg-muted-area/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container-custom py-12">
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg bg-accent/20" />
            <Skeleton className="h-10 md:h-12 w-1/3 rounded-2xl bg-muted-area/50" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full bg-muted-area/30" />)}
          </div>
          <Skeleton className="h-6 w-1/2 rounded-lg bg-muted-area/30" />
        </div>
        <GridItemsSkeleton />
      </main>
      <Footer />
    </div>
  );
}

export function SidebarGridSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container-custom py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 md:mb-10">
          <Skeleton className="h-4 w-12 bg-muted-area/30" />
          <Skeleton className="h-4 w-4 bg-muted-area/20 opacity-30" />
          <Skeleton className="h-4 w-20 bg-muted-area/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="flex flex-col gap-6 mb-12 md:mb-16">
              <Skeleton className="h-7 w-28 rounded-full bg-muted-area/50" />
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <Skeleton className="h-10 md:h-16 w-3/4 md:w-1/2 rounded-2xl bg-muted-area/50" />
                <Skeleton className="h-5 w-24 rounded-lg bg-muted-area/30" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-6 bg-card p-5 rounded-3xl border border-border-theme">
                  <Skeleton className="w-full aspect-[16/10] rounded-2xl bg-muted-area/30" />
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full rounded-lg bg-muted-area/30" />
                    <Skeleton className="h-12 w-full rounded-lg bg-muted-area/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-8">
              <Skeleton className="h-96 w-full rounded-3xl bg-card border border-border-theme" />
              <Skeleton className="h-64 w-full rounded-3xl bg-card border border-border-theme" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function EventsSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <div className="container-custom py-8 md:py-12">
          <Skeleton className="h-10 md:h-20 w-1/2 sm:w-1/3 mb-4 rounded-2xl bg-muted-area/50" />
          <Skeleton className="h-5 md:h-8 w-2/3 sm:w-1/2 rounded-lg bg-muted-area/30" />
        </div>
        
        {/* Featured Event Skeleton (Matching FeaturedEvent.tsx) */}
        <div className="container-custom py-16">
          <div className="bg-card rounded-[3rem] p-8 lg:p-12 border border-border-theme">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <Skeleton className="aspect-video lg:aspect-[4/3] rounded-[2rem] bg-muted-area/20" />
              <div className="space-y-6">
                <Skeleton className="h-4 w-32 rounded-lg bg-muted-area/50" />
                <Skeleton className="h-12 md:h-16 w-full rounded-2xl bg-muted-area/40" />
                <Skeleton className="h-6 w-3/4 rounded-lg bg-muted-area/30" />
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-24 rounded-lg bg-muted-area/20" />
                  <Skeleton className="h-5 w-24 rounded-lg bg-muted-area/20" />
                </div>
                <Skeleton className="h-14 w-40 rounded-2xl bg-primary/20" />
              </div>
            </div>
          </div>
        </div>

        <div className="container-custom grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-4 bg-card p-5 sm:p-6 rounded-[2rem] border border-border-theme shadow-sm">
              <Skeleton className="w-full aspect-square rounded-2xl bg-muted-area/30" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-24 rounded-lg bg-muted-area/50" />
                <Skeleton className="h-8 w-full rounded-lg bg-muted-area/30" />
                <Skeleton className="h-6 w-3/4 rounded-lg bg-muted-area/20" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-[280px] bg-slate-950 h-screen flex-shrink-0 p-6 hidden md:block">
        <Skeleton className="h-10 w-full bg-slate-900 mb-8 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="flex-grow p-8">
        <div className="flex justify-between items-center mb-12">
          <Skeleton className="h-10 w-64 bg-muted-area/50" />
          <Skeleton className="h-12 w-32 rounded-2xl bg-muted-area/30" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-32 w-full rounded-3xl bg-muted-area/20" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-3xl bg-card border border-border-theme" />
      </div>
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container-custom py-8 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 space-y-6 sticky top-24 self-start">
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border-theme">
              <Skeleton className="h-8 w-32 mb-4 rounded-lg bg-muted-area/50" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl bg-muted-area/20" />
                ))}
              </div>
            </div>
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
              <Skeleton className="h-6 w-32 mb-4 rounded-lg bg-muted-area/40" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-4 w-full rounded-lg bg-muted-area/20" />
                ))}
              </div>
            </div>
          </aside>

          {/* Main Feed */}
          <div className="flex-1 space-y-6">
            {/* Top Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-3xl shadow-sm border border-border-theme">
              <Skeleton className="h-12 w-full sm:w-48 rounded-2xl bg-muted-area/20" />
              <Skeleton className="h-12 w-full sm:w-40 rounded-2xl bg-primary/20" />
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card p-6 rounded-3xl shadow-sm border border-border-theme">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="w-10 h-10 rounded-full bg-muted-area/30" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="w-32 h-4 bg-muted-area/40" />
                      <Skeleton className="w-24 h-3 bg-muted-area/20" />
                    </div>
                  </div>
                  <Skeleton className="w-3/4 h-6 mb-4 bg-muted-area/30" />
                  <div className="space-y-2">
                    <Skeleton className="w-full h-4 bg-muted-area/20" />
                    <Skeleton className="w-full h-4 bg-muted-area/20" />
                    <Skeleton className="w-5/6 h-4 bg-muted-area/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar - Right */}
          <aside className="hidden xl:block w-80 space-y-6 sticky top-24 self-start">
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border-theme">
              <Skeleton className="h-8 w-40 mb-4 rounded-lg bg-muted-area/50" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32 rounded-lg bg-muted-area/20" />
                    <Skeleton className="h-4 w-12 rounded-lg bg-muted-area/10" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
