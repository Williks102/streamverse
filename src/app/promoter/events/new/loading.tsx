import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-8">
      <Button variant="outline" disabled>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film /> <Skeleton className="h-8 w-48" /> {/* Title */}
          </div>
          <Skeleton className="h-4 w-3/4 mt-1" /> {/* Description */}
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
          ))}
          <Skeleton className="h-10 w-full mt-4" /> {/* Button */}
        </CardContent>
      </Card>
    </div>
  );
}
