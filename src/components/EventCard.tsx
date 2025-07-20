
import Link from 'next/link';
import Image from 'next/image';
import type { AppEvent } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Radio, Edit3, Eye, Ticket, ShieldOff, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getLowestPrice } from '@/lib/utils';

interface EventCardProps {
  event: AppEvent;
  managementMode?: boolean; // For promoter dashboard
  onTogglePublish?: React.ReactNode;
}

export default function EventCard({ event, managementMode = false, onTogglePublish }: EventCardProps) {
  const { id, title, description, thumbnailUrl, type, category, status, duration, startTime, promoterInfo, tickets, isPublished } = event;
  
  const getLinkHref = () => {
    switch(type) {
      case 'live': return `/live/${id}`;
      case 'vod': return `/vod/${id}`;
      case 'offline': return `/offline/${id}`;
      default: return '#';
    }
  };
  const linkHref = getLinkHref();
  const checkoutLink = `/events/${id}/checkout`;
  const editLink = `/promoter/events/${id}/edit`;
  
  const lowestPrice = getLowestPrice(tickets);
  const isFree = lowestPrice === 0;

  const formatStartTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'N/A';
    }
  };
  
  return (
    <Card className={cn(
      "flex flex-col overflow-hidden h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
      managementMode && !isPublished && "border-dashed border-amber-500"
    )}>
      <CardHeader className="p-0">
        <Link href={linkHref} className="block relative aspect-video">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover hover:scale-105 transition-transform duration-300"
            data-ai-hint={event['data-ai-hint']}
          />
           {!isPublished && managementMode && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="flex items-center gap-1 text-lg">
                  <ShieldOff size={16} /> Non Publié
                </Badge>
              </div>
           )}
          {status === 'live' && isPublished && (
            <Badge variant="destructive" className="absolute top-2 right-2 flex items-center gap-1">
              <Radio size={14} className="animate-pulse" /> LIVE
            </Badge>
          )}
           {status === 'upcoming' && startTime && isPublished && (
            <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1">
              <Clock size={14} /> Débute à {formatStartTime(startTime)}
            </Badge>
          )}
           <Badge variant={isFree ? 'secondary' : 'default'} className="absolute top-2 left-2">
            {isFree ? 'Gratuit' : `À partir de ${lowestPrice.toLocaleString('fr-FR')} XOF`}
           </Badge>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline">{category}</Badge>
          {promoterInfo && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {promoterInfo.avatarUrl && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={promoterInfo.avatarUrl} alt={promoterInfo.name} data-ai-hint="promoter logo"/>
                  <AvatarFallback>{promoterInfo.name.substring(0,1)}</AvatarFallback>
                </Avatar>
              )}
              <span>{promoterInfo.name}</span>
            </div>
          )}
        </div>
        <CardTitle className="text-lg mb-1 leading-tight">
          <Link href={linkHref} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">{description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {managementMode ? (
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button asChild variant="outline" size="icon">
                <Link href={linkHref} title="Voir l'événement"><Eye className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="secondary" size="icon">
                <Link href={editLink} title="Modifier l'événement"><Edit3 className="h-4 w-4" /></Link>
              </Button>
            </div>
            {onTogglePublish}
          </div>
        ) : (
          isFree || type === 'offline' ? (
            <Button asChild className="w-full" variant="default">
              <Link href={linkHref}>
                {type === 'live' && (status === 'live' ? 'Regarder en direct' : 'Voir l\'événement')}
                {type === 'vod' && 'Regarder maintenant'}
                {type === 'offline' && <> <MapPin className="mr-2 h-4 w-4" /> Voir les détails</> }
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full" variant="default">
              <Link href={checkoutLink}>
                <Ticket className="mr-2 h-4 w-4" />
                Acheter ({lowestPrice.toLocaleString('fr-FR')} XOF)
              </Link>
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
}
