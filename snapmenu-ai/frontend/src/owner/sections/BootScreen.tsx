import { Loader2, WifiOff } from 'lucide-react';
import { Button } from '../../ui';

export function BootScreen({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-brand-fg">
        {error ? <WifiOff className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
      </div>
      {error ? (
        <>
          <div>
            <p className="text-sm font-semibold text-content">Couldn’t load your dashboard</p>
            <p className="mt-1 text-sm text-content-muted">
              Check that the API server is running, then try again.
            </p>
          </div>
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </>
      ) : (
        <p className="text-sm text-content-muted">Loading your dashboard…</p>
      )}
    </div>
  );
}
