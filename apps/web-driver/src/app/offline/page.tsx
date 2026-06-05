import { CloudOff } from 'lucide-react';

export default function OfflinePage(): React.JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <CloudOff className="size-12 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold">You are offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your recent deliveries are saved on this device. Any actions you take will sync
        automatically once you are back online.
      </p>
    </div>
  );
}
