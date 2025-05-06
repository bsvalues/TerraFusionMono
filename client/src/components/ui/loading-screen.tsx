import { Loader2 } from "lucide-react";

/**
 * Loading screen component displayed during route transitions
 * and initial lazy-loaded component loading
 */
export default function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}