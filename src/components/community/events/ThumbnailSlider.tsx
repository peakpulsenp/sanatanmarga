export default function ThumbnailSlider({ media, onSelect }: { media: any[], onSelect: (index: number) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {media.map((item, i) => (
        <img key={i} src={item.url || null} alt={`Thumbnail ${i + 1}`} onClick={() => onSelect(i)} className="w-24 h-24 rounded-2xl object-cover cursor-pointer hover:opacity-80 border-2 border-border-theme" referrerPolicy="no-referrer" />
      ))}
    </div>
  );
}
