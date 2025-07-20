
import EventCard from '@/components/EventCard';
import { getPublishedEvents } from '@/lib/data';

export default async function VodPage() {
  const allEvents = await getPublishedEvents();
  const vodEvents = allEvents.filter(event => event.type === 'vod');
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Video On Demand</h1>
      {vodEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vodEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No VOD content currently available. Check back soon!</p>
      )}
    </div>
  );
}
