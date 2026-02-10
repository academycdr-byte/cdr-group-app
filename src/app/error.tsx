"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h2 className="text-xl font-bold text-foreground">Algo deu errado</h2>
        <div className="rounded-lg bg-destructive/10 p-4 text-left">
          <p className="text-sm font-mono text-destructive break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Digest: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
