import { motion } from "motion/react";

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
}

export default function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative py-8">
      <div className="absolute left-8 top-8 bottom-8 w-px bg-border-theme" />
      <div className="flex flex-col gap-10">
        {events.map((event, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="relative pl-20"
          >
            <div className="absolute left-4 w-9 h-9 bg-primary rounded-full border-4 border-card shadow-lg flex items-center justify-center text-white font-black text-sm">
              {index + 1}
            </div>
            <div className="bg-muted-area p-8 rounded-3xl border border-border-theme">
              <span className="text-xs font-black text-primary uppercase tracking-widest">{event.time}</span>
              <h4 className="text-xl font-black text-card-foreground mt-2">{event.title}</h4>
              <p className="text-muted-text mt-2 leading-relaxed">{event.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
