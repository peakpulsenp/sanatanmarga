import { BlogCategory, BlogPost, BlogSeries } from "@/src/types";

export const CANONICAL_BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: "cat_dharma",
    slug: "dharma",
    name: "Dharma & Ethics",
    nameNe: "धर्म र नीतिशास्त्र",
    description: "Foundational principles of cosmic order, righteous conduct, and societal harmony in Sanatan tradition.",
    descriptionNe: "सनातन परम्परामा ब्रह्माण्डीय सन्तुलन, कर्तव्य र सदाचारका शाश्वत सिद्धान्तहरू।",
    icon: "Flame",
    order: 1,
    isActive: true,
    isFeatured: true,
    postCount: 12
  },
  {
    id: "cat_darshan",
    slug: "darshan",
    name: "Vedic Philosophy & Darshan",
    nameNe: "दर्शन तथा तत्त्वज्ञान",
    description: "Deep explorations of the Shad-Darshana: Vedanta, Samkhya, Yoga, Nyaya, Vaisheshika, and Mimamsa.",
    descriptionNe: "षड्दर्शन (वेदान्त, सांख्य, योग, न्याय, वैशेषिक, मीमांसा) र तत्त्वज्ञानको गम्भीर विमर्श।",
    icon: "BookOpen",
    order: 2,
    isActive: true,
    isFeatured: true,
    postCount: 15
  },
  {
    id: "cat_vedas_upanishads",
    slug: "vedas-upanishads",
    name: "Vedas & Upanishads",
    nameNe: "वेद तथा उपनिषद्",
    description: "Commentaries, translations, and insights into Shruti literature and timeless Upanishadic dialogues.",
    descriptionNe: "श्रुति वाङ्मय, मन्त्र-रहस्य तथा उपनिषद्का कालजयी संवाद र सूक्तहरूको भाष्य।",
    icon: "Sparkles",
    order: 3,
    isActive: true,
    isFeatured: true,
    postCount: 9
  },
  {
    id: "cat_gita",
    slug: "bhagavad-gita",
    name: "Bhagavad Gita Wisdom",
    nameNe: "श्रीमद्भगवद्गीता विचार",
    description: "Applied wisdom from the 18 chapters of Bhagavad Gita for leadership, duty, and spiritual liberation.",
    descriptionNe: "कर्मयोग, ज्ञानयोग र भक्तियोगका १८ अध्यायहरूको व्यावहारिक जीवन-दर्शन।",
    icon: "Compass",
    order: 4,
    isActive: true,
    isFeatured: true,
    postCount: 18
  },
  {
    id: "cat_itihasa_purana",
    slug: "itihasa-purana",
    name: "Itihasa & Purana",
    nameNe: "इतिहास तथा पुराण",
    description: "Narratives, allegories, and civilizational lessons from the Ramayana, Mahabharata, and 18 Mahapuranas.",
    descriptionNe: "रामायण, महाभारत तथा १८ महापुराणहरूका ऐतिहासिक एवं आख्यानिक विवेचना।",
    icon: "Layers",
    order: 5,
    isActive: true,
    isFeatured: true,
    postCount: 11
  },
  {
    id: "cat_temples_tirtha",
    slug: "temples-tirtha",
    name: "Sacred Geography & Temples",
    nameNe: "तीर्थ तथा मन्दिर सम्पदा",
    description: "Architectural, spiritual, and historical analysis of ancient temple complexes and sacred tirthas across Nepal and Bharat.",
    descriptionNe: "नेपाल तथा भारतवर्षका प्राचीन मन्दिर, वास्तुशास्त्र, शक्तिपीठ र पुण्य तीर्थहरूको विमर्श।",
    icon: "Building2",
    order: 6,
    isActive: true,
    isFeatured: true,
    postCount: 14
  },
  {
    id: "cat_festivals",
    slug: "festivals-traditions",
    name: "Festivals & Samskaras",
    nameNe: "पर्व, उत्सव तथा संस्कार",
    description: "The astronomical significance, rituals, and philosophical depths of Sanatan festivals and life-cycle rites.",
    descriptionNe: "सनातन चाडपर्व, खगोलीय महत्त्व, षोडश संस्कार तथा पारिवारिक अनुष्ठानहरूको रहस्य।",
    icon: "Calendar",
    order: 7,
    isActive: true,
    isFeatured: true,
    postCount: 8
  },
  {
    id: "cat_yoga_sadhana",
    slug: "yoga-sadhana",
    name: "Yoga, Meditation & Sadhana",
    nameNe: "योग, ध्यान तथा साधना",
    description: "Practical and traditional guides on Ashtanga Yoga, Pranayama, mantra japa, and inner consciousness.",
    descriptionNe: "अष्टाङ्ग योग, प्राणायाम, मन्त्र साधना र आत्म-साक्षात्कारका प्रामाणिक विधिहरू।",
    icon: "Activity",
    order: 8,
    isActive: true,
    isFeatured: true,
    postCount: 10
  },
  {
    id: "cat_nepal_himalayas",
    slug: "nepal-himalayas",
    name: "Nepal & Himalayan Traditions",
    nameNe: "नेपाल र हिमालयीय परम्परा",
    description: "Unique tantric, Shaiva, Shakta, and Buddhist syncretism across the sacred Himalayan belt.",
    descriptionNe: "हिमालयीय क्षेत्रका तन्त्र, शैव, शाक्त तथा बौद्ध समन्वयको अद्वितीय सांस्कृतिक सम्पदा।",
    icon: "Globe",
    order: 9,
    isActive: true,
    isFeatured: true,
    postCount: 16
  },
  {
    id: "cat_culture_heritage",
    slug: "culture-heritage",
    name: "Civilizational History & Heritage",
    nameNe: "सभ्यता र सांस्कृतिक सम्पदा",
    description: "Manuscripts, epigraphy, Sanskrit linguistics, and civilizational contributions of Sanatan knowledge systems.",
    descriptionNe: "पाण्डुलिपि, शिलालेख, संस्कृत भाषा र सनातन ज्ञान परम्पराको ऐतिहासिक योगदान।",
    icon: "GraduationCap",
    order: 10,
    isActive: true,
    isFeatured: false,
    postCount: 7
  }
];

export const CANONICAL_BLOG_SERIES: BlogSeries[] = [
  {
    id: "series_upanishad_journey",
    slug: "upanishadic-inquiries",
    title: "The Light of Upanishadic Inquiries",
    titleNe: "उपनिषद्का ज्योतिर्मय संवादहरू",
    description: "A deep dive into the dialogue between Nachiketa and Yama in Katha Upanishad regarding the immortal Self.",
    descriptionNe: "कठोपनिषद्मा नचिकेता र यमराज बीचको अमर आत्म-तत्त्व विमर्श।",
    featuredImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200",
    authorId: "scholar_acharyasharma",
    authorName: "Acharya Vidyadhar Sharma",
    totalParts: 5,
    postsCount: 3,
    status: "active",
    createdAt: "2026-01-15T00:00:00Z"
  },
  {
    id: "series_temple_architecture",
    slug: "sacred-himalayan-architecture",
    title: "Geometry of the Sacred: Himalayan Temples",
    titleNe: "पवित्र ज्यामिति: हिमालयका शिखर र प्यागोडा शैली",
    description: "Unraveling the Vastu Purusha Mandala and cosmological architecture of Kathmandu Valley pagoda and shikhara temples.",
    descriptionNe: "काठमाडौँ उपत्यकाका प्यागोडा र शिखर शैलीका मन्दिरहरूमा निहित वास्तु पुरुष मण्डलको रहस्य।",
    featuredImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=1200",
    authorId: "scholar_drshrestha",
    authorName: "Dr. Ananda Raj Shrestha",
    totalParts: 4,
    postsCount: 2,
    status: "active",
    createdAt: "2026-02-01T00:00:00Z"
  }
];

export const CANONICAL_BLOG_POSTS: BlogPost[] = [
  {
    id: "blog_katha_upanishad_nachiketa",
    slug: "nachiketas-quest-immortal-soul-katha-upanishad",
    title: "Nachiketa’s Quest: Discerning the Perishable from the Eternal in Katha Upanishad",
    titleNe: "नचिकेताको अमर जिज्ञासा: कठोपनिषद्मा प्रेय र श्रेयको विवेक",
    subtitle: "How the young seeker turned down worldly temptations to master the supreme secret of Atman.",
    subtitleNe: "सांसारिक प्रलोभनलाई त्यागेर आत्म-तत्त्वको परम रहस्य उद्घाटन गर्ने बालक नचिकेताको अमर साधना।",
    excerpt: "In the sacred dialogue between Yama and young Nachiketa, Katha Upanishad articulates the eternal dichotomy between Preya (the pleasurable) and Shreya (the spiritually beneficial).",
    excerptNe: "कठोपनिषद्मा यमराज र नचिकेताबीचको अमर संवादले 'प्रेय' (क्षणिक सुख) र 'श्रेय' (परम कल्याण) को शाश्वत विवेकलाई प्रष्ट पार्दछ।",
    body: `### The Threshold of the Supreme Mystery

When young Nachiketa stood at the portal of Yama, the Lord of Death, he was not merely confronting mortality; he was inquiring into the supreme metaphysical question that has animated human civilization since the dawn of thought: *What remains when the physical apparatus dissolves?*

Yama offered him sovereign kingdoms, boundless wealth, celestial maidens, and longevity spanning millennia. Nachiketa’s immortal response echoes across the millennia:

> *"Ephemeral are all these, O Death, and they wear out the vigour of all the senses of man. Keep thy horses, keep thy dancing and thy song to thyself. Man cannot be satisfied with wealth."* (Katha Upanishad 1.1.26–27)

---

### The Two Paths: Shreya and Preya

The core philosophical pivot of the Katha Upanishad lies in the discrimination between two divergent paths:

1. **Shreya (श्रेय):** The path of the good, the elevating, and the transcendent. It demands discernment (*viveka*) and self-mastery.
2. **Preya (प्रेय):** The path of the immediately pleasurable, sensual, and transient. It entangles the unreflective mind in cyclic craving.

Both paths present themselves to human consciousness at every juncture of existence. The wise (*dhira*) examines them minutely and chooses Shreya over Preya, whereas the undiscerning individual, driven by short-sighted desires, clings to worldly acquisition and sensory indulgence.

\`\`\`
   ┌──────────────────────────────────────────────┐
   │         HUMAN LIFE CHOICES (विवेक)          │
   ├──────────────────────┬───────────────────────┤
   │     SHREYA (श्रेय)   │      PREYA (प्रेय)    │
   │ • Ultimate Liberation│ • Immediate Pleasure  │
   │ • Inner Illumination │ • Sensory Bondage     │
   │ • Permanent Peace    │ • Transience & Grief  │
   └──────────────────────┴───────────────────────┘
\`\`\`

---

### The Chariot Analogy: Anatomy of Human Consciousness

In the third chapter (*Valli* 3), the Upanishad unveils the profound master-metaphor of the Chariot:

* **The Soul (Atman)** is the master seated within the chariot (*Rathi*).
* **The Body** is the physical chariot (*Ratha*).
* **The Intellect (Buddhi)** is the driver (*Sarathi*).
* **The Mind (Manas)** is the reins.
* **The Senses (Indriyas)** are the turbulent horses.
* **The Sense Objects (Vishayas)** are the roads trodden upon.

He whose intellect is undisciplined and whose mind is restless cannot steer the senses; his horses run wild, plunging the chariot into the abyss of cyclic suffering. Conversely, the seeker who wields a disciplined intellect (*buddhi-sarathi*) directs the mind to rein in the senses, arriving triumphantly at the highest abode of Vishnu—the state of unconditioned freedom.

---

### Contemporary Relevance for Sanatan Consciousness

In an age dominated by instantaneous digital gratification and consumerist dopamine loops, the ancient wisdom of the Katha Upanishad serves as a beacon of clarity. True empowerment is not the endless accumulation of perishable artifacts, but the conscious awakening to our unconditioned, luminous core.`,
    bodyNe: `### परम रहस्यको द्वारमा नचिकेताको निष्ठा

जब बालक नचिकेता यमराजको द्वारमा पुगे, उनी केवल मृत्युको सामना गरिरहेका थिएनन्; उनी मानव सभ्यताको सबैभन्दा गम्भीर प्रश्नको उत्तर खोज्दै थिए: *शरीरको अन्त्यपछि के रहन्छ?*

यमराजले उनलाई विशाल साम्राज्य, अथाह धन, अप्सराहरू र लामो आयुको प्रलोभन देखाए। तर नचिकेताको उत्तर कालजयी रह्यो:

> *"हे यमराज, यी सबै सांसारिक सुखहरू क्षणभङ्गुर हुन्, जसले इन्द्रियहरूको तेजलाई क्षीण बनाउँछन्। तपाईंका रथ, नृत्य र गीत तपाईंसँगै रहोस्। मनुष्य धनले कहिल्यै तृप्त हुन सक्दैन।"* (कठोपनिषद् १.१.२६–२७)

---

### श्रेय र प्रेय: जीवनका दुई मार्ग

कठोपनिषद्को मुख्य दार्शनिक सन्देश जीवनमा उपलब्ध दुई मार्गको पहिचान हो:

1. **श्रेय (परम कल्याण):** आत्मिक उत्थान र मोक्षको मार्ग। यसले विवेक र इन्द्रिय-संयमको माग गर्दछ।
2. **प्रेय (क्षणिक सुख):** इन्द्रिय-तृप्ति र तत्काल रमाइलो लाग्ने तर अन्ततः बन्धनमा पार्ने मार्ग।

विवेकी पुरुषले श्रेयलाई रोज्छ भने अज्ञानीले प्रेयको पछि लागेर संसार-चक्रमा दुःख भोग्छ।

---

### रथ-रूपक: मानव चेतनाको संरचना

कठोपनिषद्को तेस्रो वल्लीमा जीवनलाई रथको सुन्दर रूपक दिइएको छ:
* **आत्मा:** रथको स्वामी (रथी)
* **शरीर:** रथ
* **बुद्धि:** सारथि (चालक)
* **मन:** लगाम
* **इन्द्रियहरू:** बलिया घोडाहरू
* **विषय-भोग:** यात्राका बाटाहरू

यदि सारथि (बुद्धि) सजग छ र मनरूपी लगाम दृढ छ भने घोडाहरू (इन्द्रियहरू) नियन्त्रणमा रहन्छन् र रथ गन्तव्य (मोक्ष) सम्म पुग्छ।`,
    featuredImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200",
    authorId: "scholar_acharyasharma",
    authorDisplayName: "Acharya Vidyadhar Sharma",
    authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    authorBio: "Vedic scholar, Sanskrit philologist, and researcher in Himalayan philosophical traditions at Sanatan Marga.",
    authorBioNe: "सनातन मार्गका वरिष्ठ वैदिक विद्वान्, संस्कृत भाषाविद् तथा दर्शन अन्वेषक।",
    createdBy: "admin_uid_sanatan_system",
    categoryId: "cat_vedas_upanishads",
    categorySlug: "vedas-upanishads",
    categoryName: "Vedas & Upanishads",
    categoryNameNe: "वेद तथा उपनिषद्",
    tags: ["upanishad", "katha-upanishad", "nachiketa", "vedanta", "atman", "darshan"],
    seriesId: "series_upanishad_journey",
    seriesSlug: "upanishadic-inquiries",
    seriesName: "The Light of Upanishadic Inquiries",
    seriesOrder: 1,
    language: "bilingual",
    status: "published",
    featured: true,
    pinned: true,
    readingTimeMinutes: 7,
    seoTitle: "Nachiketa's Quest in Katha Upanishad: Shreya vs Preya Philosophy",
    seoDescription: "An authoritative philosophical exploration of Katha Upanishad, the chariot allegory, and Nachiketa's dialogue with Yama.",
    scriptureReferences: [
      {
        text: "Katha Upanishad",
        bookOrKanda: "First Adhyaya",
        chapter: "1",
        verse: "26-27",
        devanagariText: "श्वोभावा मर्त्यस्य यदन्तकैतत्सर्वेंद्रियाणां जरयंति तेजः। अपि सर्वं जीवितमल्पमेव तवैव वाहास्तव नृत्यगीते॥",
        transliteration: "śvobhāvā martyasya yadantakaitatsarvendriyāṇāṁ jarayanti tejaḥ | api sarvaṁ jīvitalpameva tavaiva vāhāstava nṛtyagīte ||",
        englishTranslation: "Ephemeral are these, O Death! They wear out the vigor of all senses. Keep thy chariots and thy dance and song to thyself.",
        nepaliTranslation: "यी सबै सांसारिक सुख भोलि नै नाश हुने हुन्, जसले इन्द्रियको तेजलाई क्षीण गर्छन्। तपाईंका रथ र नाचगान तपाईंसँगै रहोस्।"
      },
      {
        text: "Katha Upanishad",
        bookOrKanda: "First Adhyaya",
        chapter: "2",
        verse: "1-2",
        devanagariText: "अन्यच्छ्रेयोऽन्यदुतैव प्रेयस्ते उभे नानार्थे पुरुषं सिनीतः। तयोः श्रेय आददानस्य साधु भवति हीयतेऽर्थाद्य उ प्रेयो वृणीते॥",
        transliteration: "anyacchreyo'nyadutaiva preyaste ubhe nānārthe puruṣaṁ sinītaḥ | tayoḥ śreya ādadānasya sādhu bhavati hīyate'rthādya u preyo vṛṇīte ||",
        englishTranslation: "The good is one thing and the pleasant is another. These two, having different ends, bind a man. It is well with him who clings to the good; but he who chooses the pleasant misses his true goal."
      }
    ],
    sgisReferences: [
      {
        entityId: "sgis_ms_katha_0482",
        entityType: "manuscript",
        title: "Katha Upanishad Bhashya Palm Leaf Manuscript",
        titleNe: "कठोपनिषद् शाङ्करभाष्य तालपत्र पाण्डुलिपि",
        sanskritTitle: "कठोपनिषद् भाष्यम्",
        manuscriptNumber: "NGMCP A 108/14",
        deepLink: "/sgis?query=katha-upanishad"
      }
    ],
    knowledgeGraphEntities: ["Nachiketa", "Yama", "Atman", "Shankaracharya", "Katha Upanishad"],
    sources: [
      "Eight Upanishads with the Commentary of Sankaracarya, Swami Gambhirananda, Advaita Ashrama",
      "The Principal Upanishads, S. Radhakrishnan, HarperCollins"
    ],
    views: 1420,
    shares: 184,
    likesCount: 96,
    createdAt: "2026-03-01T08:00:00Z",
    updatedAt: "2026-03-02T10:00:00Z",
    publishedAt: "2026-03-02T12:00:00Z",
    snapshotVersion: "4.2.7-rc2",
    schemaVersion: 3
  },
  {
    id: "blog_pashupatinath_sacred_mandala",
    slug: "pashupatinath-mandala-sacred-cosmology-bagmati",
    title: "Pashupatinath: The Five-Faced Lingam and Sacred Geometry of the Bagmati",
    titleNe: "पशुपतिनाथ: पञ्चानन लिङ्ग र बागमतीको पवित्र ब्रह्माण्डीय ज्यामिति",
    subtitle: "Exploring the Sadyojata, Vamadeva, Aghora, Tatpurusha, and Ishana aspects of the supreme Shaivite sanctuary.",
    subtitleNe: "सद्योजात, वामदेव, अघोर, तत्पुरुष र ईशान- पशुपतिनाथका पाँच मुखहरूको दार्शनिक तथा तान्त्रिक महत्त्व।",
    excerpt: "Pashupatinath is not merely a temple; it is a live metaphysical mandala embodying the five elements, the cosmic directions, and the transcendent fifth face looking directly into the sky.",
    excerptNe: "पशुपतिनाथ केवल एक तीर्थ मात्र होइन; यो पञ्चमहाभूत, दिक्पाल तथा ब्रह्माण्डीय चेतनाको जीवन्त तान्त्रिक मण्डल हो।",
    body: `### The Cosmic Axis of the Himalayas

Nestled along the serene banks of the sacred Bagmati River in Kathmandu, **Shree Pashupatinath Temple** stands as the spiritual epicenter of the Himalayas. Mentioned reverently across the *Shiva Purana*, *Skanda Purana (Himavat Khanda)*, and the *Linga Purana*, the sanctuary embodies the eternal Shaiva Siddhanta and Pashupata philosophies.

---

### The Mystery of the Five Faces (Panchamukha)

At the heart of the sanctum sanctorum rises the black stone **Chaturmukha Lingam**, which in reality represents the **Panchamukha** (five-faced) manifestation of Parashiva:

1. **West (Sadyojata - सद्योजात):** Represents the Earth element (*Prithvi*), the creative power of Brahma, and pristine white illumination.
2. **North (Vamadeva - वामदेव):** Represents Water (*Jala*), the sustaining grace of Vishnu, and healing compassion.
3. **South (Aghora - अघोर):** Represents Fire (*Agni*), the transformative power of Rudra, and righteous wrath against ignorance.
4. **East (Tatpurusha - तत्पुरुष):** Represents Air (*Vayu*), the meditative power of Ishvara, and radiant golden illumination.
5. **Zenith (Ishana - ईशान):** The transcendent fifth face facing the sky, representing Space (*Akasha*) and pure, unmanifest Shiva consciousness (*Sadashiva*).

\`\`\`
                     [NORTH]
                 Vamadeva (जल / जल-तत्त्व)
                        ▲
                        │
 [WEST]                 │                 [EAST]
Sadyojata  ◄─────── [ISHANA] ───────► Tatpurusha
(पृथ्वी)           (आकाश/सर्वव्यापी)      (वायु)
                        │
                        │
                        ▼
                     [SOUTH]
                  Aghora (अग्नि)
\`\`\`

---

### The Bagmati as the Ganga of Nepal

The Bagmati river is conceived in the *Himavat Khanda* as the manifestation of the cosmic stream arising from Shiva's locks. The confluence of Aryaghat, Ramghat, and the Guhyeshwari Shakta Peetha completes the divine Shiva-Shakti union, rendering the precinct an inexhaustible vortex of spiritual liberation (*Moksha-Tirtha*).`,
    bodyNe: `### हिमालयको आध्यात्मिक केन्द्र: श्री पशुपतिनाथ

काठमाडौँ उपत्यकाको बागमती नदी किनारमा अवस्थित **श्री पशुपतिनाथ मन्दिर** सम्पूर्ण सनातन जगतको सर्वोच्च शैव पीठ हो। *शिव पुराण*, *स्कन्द पुराण (हिमवत्खण्ड)* तथा *लिङ्ग पुराण* मा यस ज्योतिर्लिंग-समान क्षेत्रको अपार महिमा वर्णित छ।

---

### पञ्चानन पशुपति: पाँच मुखहरूको रहस्य

गर्भगृहमा अवस्थित पशुपतिनाथको शिला विग्रहमा पञ्चमुखी शिवको दिव्य स्वरूप विद्यमान छ:

1. **पश्चिम (सद्योजात):** पृथ्वी तत्त्व, सिर्जनात्मक शक्ति।
2. **उत्तर (वामदेव):** जल तत्त्व, पालन र दयालु स्वरूप।
3. **दक्षिण (अघोर):** अग्नि तत्त्व, अज्ञान संहारक रुद्र स्वरूप।
4. **पूर्व (तत्पुरुष):** वायु तत्त्व, ध्यानमग्न ईश्वरीय स्वरूप।
5. **ऊर्ध्व (ईशान):** आकाश तत्त्व, सम्पूर्ण दिशा र सीमाभन्दा माथि रहेको निर्गुण परब्रह्म शिव।`,
    featuredImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=1200",
    authorId: "scholar_drshrestha",
    authorDisplayName: "Dr. Ananda Raj Shrestha",
    authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    authorBio: "Historian of sacred Himalayan geography and temple architecture at Sanatan Marga.",
    authorBioNe: "हिमालयीय मन्दिर वास्तुकला तथा पवित्र भूगोलका अनुसन्धाता।",
    createdBy: "admin_uid_sanatan_system",
    categoryId: "cat_temples_tirtha",
    categorySlug: "temples-tirtha",
    categoryName: "Sacred Geography & Temples",
    categoryNameNe: "तीर्थ तथा मन्दिर सम्पदा",
    tags: ["pashupatinath", "kathmandu", "shiva", "panchamukha", "temple-architecture", "bagmati"],
    language: "bilingual",
    status: "published",
    featured: true,
    pinned: false,
    readingTimeMinutes: 5,
    seoTitle: "Pashupatinath Temple Five Faces & Sacred Geometry",
    seoDescription: "Comprehensive spiritual and architectural analysis of the five-faced Shiva lingam at Pashupatinath, Nepal.",
    scriptureReferences: [
      {
        text: "Skanda Purana",
        bookOrKanda: "Himavat Khanda",
        chapter: "Nepala Mahatmya",
        verse: "Pashupati Stotra",
        englishTranslation: "He who adores Pashupati on the banks of Bagmati attains freedom from worldly bondages (pasha)."
      }
    ],
    sgisReferences: [
      {
        entityId: "sgis_temple_pashupati_001",
        entityType: "temple",
        title: "Pashupatinath Temple Complex Entity & Manuscript Archive",
        titleNe: "श्री पशुपतिनाथ क्षेत्र अभिलेख",
        deepLink: "/sgis?query=pashupatinath"
      }
    ],
    knowledgeGraphEntities: ["Pashupatinath", "Shiva", "Bagmati", "Guhyeshwari", "Kathmandu"],
    views: 2150,
    shares: 312,
    likesCount: 148,
    createdAt: "2026-02-20T08:00:00Z",
    updatedAt: "2026-02-22T10:00:00Z",
    publishedAt: "2026-02-22T12:00:00Z",
    snapshotVersion: "4.2.7-rc2",
    schemaVersion: 3
  },
  {
    id: "blog_gita_nishkama_karma_leadership",
    slug: "nishkama-karma-leadership-in-action-bhagavad-gita",
    title: "Nishkama Karma: The Bhagavad Gita’s Philosophy of Selfless Action for Modern Leadership",
    titleNe: "निष्काम कर्मयोग: श्रीमद्भगवद्गीताको कार्य-दर्शन र नेतृत्व",
    subtitle: "Transcending burnout and anxiety by liberating action from compulsive fixation on fruits.",
    subtitleNe: "कर्मफलको आसक्ति त्यागेर कर्तव्यपरायण बन्ने गीताको अमर सन्देश।",
    excerpt: "Chapter 2, Verse 47 of the Bhagavad Gita contains one of civilization's most profound psychological paradigms: action without mental paralysis over outcomes.",
    excerptNe: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन— परिणामको चिन्ताबाट मुक्त भएर उत्कृष्टताका साथ कर्म गर्ने कला।",
    body: `### The Psychology of Duty vs. Anxiety

In Chapter 2 of the *Bhagavad Gita*, Sri Krishna addresses Arjuna's psychological collapse on the battlefield of Kurukshetra. Arjuna's paralysis was not born of incapacity, but of catastrophic attachment to anticipated outcomes—anticipation of victory, loss, death, and social rupture.

Krishna’s antidote is the timeless science of **Nishkama Karma** (निष्काम कर्म)—desireless, equanimous action.

---

### The Quadruple Axiom of Karma Yoga

The monumental verse (Gita 2.47) establishes four distinct psychological principles:

\`\`\`
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥
\`\`\`

1. **You have authority solely over your actions (*Karmani eva adhikaraste*):** Your energy and focus are valid only in the immediate present sphere of action.
2. **Never over the fruits (*Ma phaleshu kadachana*):** The fruit of an action is determined by countless multidimensional cosmic, societal, and environmental variables beyond individual control.
3. **Do not let the fruit be the driving motive (*Ma karma-phala-hetur-bhuh*):** Motive fixed entirely on outcomes breeds anxiety, compromises ethical judgment, and leads to burnout.
4. **Nor let there be any attachment to inaction (*Ma te sango'stva akarmani*):** Recognizing lack of outcome-control must never degrade into apathy or fatalism.

---

### Yoga as Excellence in Execution

Later in the same chapter, Krishna synthesizes this inner poise with operational perfection:

> *"Yogah karmasu kaushalam"* (योगः कर्मसु कौशलम् — Gita 2.50)  
> **"Yoga is dexterity, skill, and excellence in action."**

When the mind is liberated from the tremors of fear of failure and euphoria of success, the entire bandwidth of human intelligence becomes available for flawless, devoted execution.`,
    bodyNe: `### कर्म र परिणाम बीचको विवेक

श्रीमद्भगवद्गीताको दोस्रो अध्यायमा भगवान् श्रीकृष्णले कुरुक्षेत्रको युद्धभूमिमा विषादग्रस्त अर्जुनलाई दिएको उपदेश केवल युद्धको लागि मात्र नभई सम्पूर्ण मानव जातिको कार्य-सम्पादनको लागि सर्वोच्च मनोविज्ञान हो।

---

### चार आधारभूत सूत्रहरू (गीता २.४७)

> **कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।**  
> **मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥**

1. **कर्ममा मात्र तिम्रो अधिकार छ:** वर्तमान समयमा तिमीले गर्ने कर्म मात्र तिम्रो नियन्त्रणमा छ।
2. **फलमा कहिल्यै अधिकार छैन:** परिणाम अनेकौँ बाह्य परिस्थितिहरूमा निर्भर गर्दछ।
3. **कर्मफलको अभिलाषी नबन:** फलको चिन्ताले कामको गुणस्तर घटाउँछ र मानसिक तनाव सिर्जना गर्छ।
4. **अकर्मण्यतामा आसक्ति नहोस्:** फल नपाइएला कि भनेर कर्म गर्नै छाड्ने गल्ती कहिल्यै नगर।`,
    featuredImage: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=1200",
    authorId: "scholar_acharyasharma",
    authorDisplayName: "Acharya Vidyadhar Sharma",
    authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    createdBy: "admin_uid_sanatan_system",
    categoryId: "cat_gita",
    categorySlug: "bhagavad-gita",
    categoryName: "Bhagavad Gita Wisdom",
    categoryNameNe: "श्रीमद्भगवद्गीता विचार",
    tags: ["bhagavad-gita", "karma-yoga", "krishna", "nishkama-karma", "leadership", "ethics"],
    language: "bilingual",
    status: "published",
    featured: false,
    pinned: false,
    readingTimeMinutes: 6,
    seoTitle: "Nishkama Karma in Bhagavad Gita: Action and Modern Leadership",
    seoDescription: "Philosophical and leadership commentary on Bhagavad Gita Chapter 2 Verse 47 on detached action.",
    scriptureReferences: [
      {
        text: "Bhagavad Gita",
        chapter: 2,
        verse: 47,
        devanagariText: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
        transliteration: "karmaṇyevādhikāraste mā phaleṣu kadācana | mā karmaphalaheturbhūrmā te saṅgo'stvakarmaṇi ||",
        englishTranslation: "Thy right is to work only, but never with its fruits; let not the fruits of action be thy motive, nor let thy attachment be to inaction."
      },
      {
        text: "Bhagavad Gita",
        chapter: 2,
        verse: 50,
        devanagariText: "बुद्धियुक्तो जहातीह उभे सुकृतदुष्कृते। तस्माद्योगाय युज्यस्व योगः कर्मसु कौशलम्॥",
        englishTranslation: "Endowed with equanimity, one frees oneself in this life from both good and evil deeds; therefore, strive for Yoga. Yoga is skill in action."
      }
    ],
    views: 1890,
    shares: 240,
    likesCount: 112,
    createdAt: "2026-02-15T08:00:00Z",
    updatedAt: "2026-02-16T10:00:00Z",
    publishedAt: "2026-02-16T12:00:00Z",
    snapshotVersion: "4.2.7-rc2",
    schemaVersion: 3
  }
];
