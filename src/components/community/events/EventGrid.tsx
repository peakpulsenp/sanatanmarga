import EventCard from "./EventCard";
import { useLanguage } from "@/src/context/LanguageContext";

interface EventGridProps {
  events: any[];
}

export default function EventGrid({ events }: EventGridProps) {
  const { language } = useLanguage();
  if (events.length === 0) return null;

  return (
    <section className="container-custom py-16">
      <h2 className="text-4xl font-black text-card-foreground mb-12 tracking-tight uppercase">
        {language === 'en' ? "Other Events & Celebrations" : "अन्य घटनाहरू"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
