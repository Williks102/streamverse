import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Button variant="outline" disabled className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Live Streams
        </Button>

        <Skeleton className="aspect-video w-full rounded-lg" />

        <div className="bg-card p-6 rounded-lg shadow-md space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
      
      <div className="lg:col-span-1">
        <Skeleton className="h-full min-h-[calc(100vh-200px)] w-full rounded-lg" />
      </div>
    </div>
  );
}
