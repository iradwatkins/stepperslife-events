"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClassDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Class Detail Error]", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Unable to Load Class
        </h2>

        <p className="text-muted-foreground mb-6">
          We couldn&apos;t load this class&apos;s details. This might be a temporary issue.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-left">
            <p className="text-xs font-mono text-destructive break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-destructive mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Link href="/instructor/classes" className="block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
