import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <UserCircle className="h-10 w-10 text-primary" />
        <Skeleton className="h-10 w-48" /> {/* Title */}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" /> {/* Card Title */}
          <Skeleton className="h-4 w-2/3 mt-1" /> {/* Card Description */}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full border border-dashed border-border rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
