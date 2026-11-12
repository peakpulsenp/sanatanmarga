export interface ImageResolutionParams {
  title?: string;
  category?: string;
  districts?: string[];
  knowledgeEntities?: string[];
  imageKeywords?: string[];
  sourceImage?: string; // Priority 1: Source featured image
  eventName?: string;   // Priority 2: EventsOS event mapping
}

export const CURATED_NEPAL_HEROES = [
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop", // Himalayas / Annapurna
  "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?q=80&w=2070&auto=format&fit=crop", // Stupa / Kathmandu
  "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop", // Temple architecture
  "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=2070&auto=format&fit=crop", // Mountain peak / Everest region
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop", // Cultural heritage Nepal
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop", // Rara Lake scenic
  "https://images.unsplash.com/photo-1546548970-71785318a17b?q=80&w=2070&auto=format&fit=crop", // Mustang landscape
  "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop"  // Lumbini peace garden
];

export const EVENT_IMAGE_MAP: Record<string, string[]> = {
  "shivaratri": [
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "buddha jayanti": [
    "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?q=80&w=2070&auto=format&fit=crop"
  ],
  "dashain": [
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "tihar": [
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?q=80&w=2070&auto=format&fit=crop"
  ],
  "indra jatra": [
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop"
  ]
};

export const KNOWLEDGE_IMAGE_MAP: Record<string, string[]> = {
  // Religion / Temples
  "pashupatinath": [
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "shivaratri": [
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2070&auto=format&fit=crop"
  ],
  "muktinath": [
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546548970-71785318a17b?q=80&w=2070&auto=format&fit=crop"
  ],
  "janaki": [
    "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop"
  ],
  "janakpur": [
    "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop"
  ],
  "swayambhunath": [
    "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?q=80&w=2070&auto=format&fit=crop"
  ],
  "boudhanath": [
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070&auto=format&fit=crop"
  ],
  "lumbini": [
    "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop"
  ],
  "buddha": [
    "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop"
  ],

  // Tourism / Mountains / Nature
  "everest": [
    "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
  ],
  "annapurna": [
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop"
  ],
  "rara": [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop"
  ],
  "mustang": [
    "https://images.unsplash.com/photo-1546548970-71785318a17b?q=80&w=2070&auto=format&fit=crop"
  ],
  "pokhara": [
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop"
  ],
  "chitwan": [
    "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?q=80&w=2070&auto=format&fit=crop"
  ],

  // Culture / Heritage
  "indra jatra": [
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop"
  ],
  "bhaktapur": [
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "kathmandu": [
    "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop"
  ],
  "patan": [
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "dashain": [
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop"
  ],
  "tihar": [
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop"
  ]
};

export const DISTRICT_IMAGE_POOL: Record<string, string[]> = {
  "kathmandu": [
    "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop"
  ],
  "lalitpur": [
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "bhaktapur": [
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "kaski": [
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop"
  ],
  "pokhara": [
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop"
  ],
  "mustang": [
    "https://images.unsplash.com/photo-1546548970-71785318a17b?q=80&w=2070&auto=format&fit=crop"
  ],
  "rupandehi": [
    "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop"
  ],
  "lumbini": [
    "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop"
  ],
  "dhanusha": [
    "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop"
  ],
  "janakpur": [
    "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop"
  ],
  "solukhumbu": [
    "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=2070&auto=format&fit=crop"
  ],
  "mugu": [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop"
  ]
};

export const CATEGORY_IMAGE_POOL: Record<string, string[]> = {
  "religion": [
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=2070&auto=format&fit=crop"
  ],
  "culture": [
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?q=80&w=2070&auto=format&fit=crop"
  ],
  "tourism": [
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=2070&auto=format&fit=crop"
  ],
  "environment": [
    "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?q=80&w=2070&auto=format&fit=crop"
  ],
  "education": [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2070&auto=format&fit=crop"
  ],
  "politics": [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2070&auto=format&fit=crop"
  ],
  "economy": [
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop"
  ]
};

function selectFromPool(pool: string[], title: string): string {
  if (!pool || pool.length === 0) return CURATED_NEPAL_HEROES[0];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

export function resolveArticleImage(params: ImageResolutionParams): string {
  const { 
    title = "", 
    category = "", 
    districts = [], 
    knowledgeEntities = [], 
    imageKeywords = [],
    sourceImage = "",
    eventName = ""
  } = params;
  
  // Priority 1: Source Featured Image
  if (sourceImage && sourceImage.startsWith("http")) {
    return sourceImage;
  }

  const textBlob = `${title} ${category} ${districts.join(" ")} ${knowledgeEntities.join(" ")} ${imageKeywords.join(" ")} ${eventName}`.toLowerCase();

  // Priority 2: EventsOS Image Mapping
  if (eventName) {
    const eLower = eventName.toLowerCase();
    for (const [key, pool] of Object.entries(EVENT_IMAGE_MAP)) {
      if (eLower.includes(key) || textBlob.includes(key)) {
        return selectFromPool(pool, title);
      }
    }
  }

  // Priority 3: Saraswati Knowledge Graph Image Mapping
  for (const [key, pool] of Object.entries(KNOWLEDGE_IMAGE_MAP)) {
    if (textBlob.includes(key)) {
      return selectFromPool(pool, title);
    }
  }

  // Priority 4: District Image Pool
  for (const district of districts) {
    const dLower = district.toLowerCase();
    if (DISTRICT_IMAGE_POOL[dLower]) {
      return selectFromPool(DISTRICT_IMAGE_POOL[dLower], title);
    }
    for (const [key, pool] of Object.entries(DISTRICT_IMAGE_POOL)) {
      if (textBlob.includes(key)) {
        return selectFromPool(pool, title);
      }
    }
  }

  // Priority 5: Category Image Pool
  const catLower = category.toLowerCase();
  if (CATEGORY_IMAGE_POOL[catLower]) {
    return selectFromPool(CATEGORY_IMAGE_POOL[catLower], title);
  }

  // Priority 6: Ultimate Nepal Hero Editorial Pool (hash-distributed)
  return selectFromPool(CURATED_NEPAL_HEROES, title);
}

