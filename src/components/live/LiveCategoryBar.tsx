interface LiveCategoryBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export default function LiveCategoryBar({ categories, selectedCategory, onSelectCategory }: LiveCategoryBarProps) {
  const allCategories = ["सबै (All)", ...categories];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 border-b border-zinc-800/80">
      <div className="flex items-center gap-2 min-w-max px-1">
        {allCategories.map((cat) => {
          const isAll = cat.startsWith("सबै");
          const val = isAll ? "" : cat;
          const isActive = selectedCategory === val;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(val)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/10"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
