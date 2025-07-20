import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-10 w-3/5 sm:w-1/3" /> {/* Title */}
        <Button disabled>
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Event
        </Button>
      </div>
      
      <Separator />

      <section>
        <Skeleton className="h-8 w-1/4 mb-6" /> {/* Section Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <Skeleton className="aspect-video w-full rounded-t-lg" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-1/3" /> {/* Badge */}
                <Skeleton className="h-6 w-full" /> {/* Title */}
                <Skeleton className="h-4 w-4/5" /> {/* Description line 1 */}
                <Skeleton className="h-4 w-3/5" /> {/* Description line 2 */}
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-10 w-full" /> {/* Button */}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />
      
      <section>
        <Skeleton className="h-8 w-1/4 mb-6" /> {/* Section Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <Skeleton className="aspect-video w-full rounded-t-lg" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-1/3" /> {/* Badge */}
                <Skeleton className="h-6 w-full" /> {/* Title */}
                <Skeleton className="h-4 w-4/5" /> {/* Description line 1 */}
                <Skeleton className="h-4 w-3/5" /> {/* Description line 2 */}
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-10 w-full" /> {/* Button */}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
