import { CloudOff } from 'lucide-react';

export default function QuotaError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="bg-muted-area p-8 rounded-full mb-6">
        <CloudOff size={48} className="text-muted-text" />
      </div>
      <h2 className="text-2xl font-black text-card-foreground mb-2">Service Temporarily Unavailable</h2>
      <p className="text-sm font-medium text-muted-text max-w-sm">
        We have temporarily reached our data usage limits. Our service resets daily. Please check back later.
      </p>
    </div>
  );
}
