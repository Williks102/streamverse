import EventCard from '@/components/EventCard';
import { getPublishedEvents } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

export default async function HomePage() {
  // ✅ Fonction asynchrone pour récupérer les données via EventService
  const allPublishedEvents = await getPublishedEvents();
  const liveEvents = allPublishedEvents.filter(e => e.type === 'live').slice(0, 3);
  const vodEvents = allPublishedEvents.filter(e => e.type === 'vod').slice(0, 3);
  const offlineEvents = allPublishedEvents.filter(e => e.type === 'offline').slice(0, 3);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-primary">Bienvenue sur StreamVerse</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Votre univers d'événements live, à la demande et physiques.
        </p>
      </section>

      {liveEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6">Événements en Direct</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {vodEvents.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="text-2xl font-semibold mb-6">Vidéos à la Demande</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vodEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        </>
      )}

      {offlineEvents.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="text-2xl font-semibold mb-6">Événements Physiques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offlineEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        </>
      )}

      {liveEvents.length === 0 && vodEvents.length === 0 && offlineEvents.length === 0 && (
        <p className="text-center text-muted-foreground text-lg py-10">
          Aucun événement n'est disponible pour le moment. Revenez bientôt !
        </p>
      )}
    </div>
  );
}