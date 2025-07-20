import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Button variant="outline" disabled className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux événements
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-4">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-1/2 mt-4" />
        </div>
      </div>
    </div>
  );
}
