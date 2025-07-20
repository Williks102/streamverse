import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-8">
      <Button variant="outline" disabled>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour au tableau de bord
      </Button>

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" /> {/* Title */}
          <Skeleton className="h-4 w-3/4 mt-1" /> {/* Description */}
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 rounded-md border border-dashed">
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
