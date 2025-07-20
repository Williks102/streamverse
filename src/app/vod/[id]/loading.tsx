import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Button variant="outline" disabled className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to VODs
      </Button>

      <Skeleton className="aspect-video w-full rounded-lg" />

      <div className="bg-card p-6 rounded-lg shadow-md space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-5 w-1/3" />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-md space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-48 w-full border border-dashed border-border rounded-md" />
      </div>
    </div>
  );
}
