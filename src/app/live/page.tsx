
import EventCard from '@/components/EventCard';
import { getPublishedEvents } from '@/lib/data';

export default async function LiveStreamsPage() {
  const allEvents = await getPublishedEvents();
  const liveEvents = allEvents.filter(event => event.type === 'live');
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Live Streams</h1>
      {liveEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No live streams currently available. Check back soon!</p>
      )}
    </div>
  );
}
