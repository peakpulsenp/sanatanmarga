import { TopicHub } from '../types/seo';

export const SANATAN_TOPIC_HUBS: Record<string, TopicHub> = {
  'sanatan-dharma': {
    slug: 'sanatan-dharma',
    title: 'Sanatan Dharma — The Eternal Order & Knowledge System',
    titleNepali: 'सनातन धर्म — अनन्त सत्य र ज्ञान परम्परा',
    description: 'Explore the foundations of Sanatan Dharma: cosmic order (Rta), righteousness (Dharma), action (Karma), liberation (Moksha), and scriptural wisdom.',
    descriptionNepali: 'सनातन धर्मका मूलभूत सिद्धान्तहरू, वैदिक जीवनदर्शन, ऋत, धर्म, कर्म, र मोक्षबारे प्रामाणिक ज्ञान।',
    category: 'Core Philosophy',
    pillarEntity: 'Sanatan Dharma',
    keyQuestions: [
      {
        question: 'What is the literal meaning of Sanatan Dharma?',
        questionNepali: 'सनातन धर्मको शाब्दिक अर्थ के हो?',
        answer: 'Sanatan means eternal, timeless, and underlying all reality. Dharma means that which sustains order, righteousness, and inherent duty.',
        answerNepali: 'सनातनको अर्थ कहिल्यै समाप्त नहुने वा नित्य हो। धर्मको अर्थ सृष्टि र मानव जीवनलाई धारण गर्ने सत्य वा नैतिक नियम हो।'
      },
      {
        question: 'What are the core texts of Sanatan Dharma?',
        questionNepali: 'सनातन धर्मका प्रमुख ग्रन्थहरू के-के हुन्?',
        answer: 'The Shruti texts (Vedas and Upanishads) form the primary divine revelation, supported by Smriti texts (Puranas, Itihasas like Ramayana and Mahabharata, and Darshanas).',
        answerNepali: 'श्रुति ग्रन्थ (वेद र उपनिषद्) मूल आधार हुन्। यसबाहेक स्मृति ग्रन्थ (पुराण, रामायण, महाभारत र षड्दर्शन) प्रमुख छन्।'
      }
    ],
    scripturalReferences: [
      { text: 'Rigveda', verse: '1.164.46', citation: 'एकं सद् वििप्रा बहुधा वदन्ति (Ekam Sat Vipra Bahudha Vadanti)' },
      { text: 'Taittiriya Upanishad', verse: '1.11.1', citation: 'सत्यं वद। धर्मं चर। (Satyam Vada, Dharmam Chara)' }
    ],
    relatedTopics: ['vedas', 'upanishads', 'bhagavad-gita', 'yoga-meditation'],
    featuredImage: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=1200&auto=format&fit=crop',
    authoritativeSources: [
      'Saraswati Grantha Intelligence System (SGIS) Manuscripts',
      'Shruti & Smriti Canonical Corpus',
      'Nepal Sanskrit University Archives'
    ]
  },
  'bhagavad-gita': {
    slug: 'bhagavad-gita',
    title: 'Bhagavad Gita — Philosophy of Action, Wisdom & Devotion',
    titleNepali: 'श्रीमद्भगवद्गीता — कर्म, ज्ञान र भक्तियोगको सार',
    description: 'Comprehensive guide to the 18 chapters of Bhagavad Gita: Karma Yoga, Jnana Yoga, Bhakti Yoga, and Krishna’s teachings to Arjuna.',
    descriptionNepali: 'भगवद्गीताका १८ अध्याय, कर्मयोग, ज्ञानयोग, भक्तियोग र भगवान् श्रीकृष्णका उपदेशहरू।',
    category: 'Itihasa & Philosophy',
    pillarEntity: 'Bhagavad Gita',
    keyQuestions: [
      {
        question: 'What is the main message of Karma Yoga in the Gita?',
        questionNepali: 'गीतामा कर्मयोगको मुख्य सन्देश के हो?',
        answer: 'Perform your obligatory duty without attachment to fruits or expectations of reward (Karmanye Vadhikaraste Ma Phaleshu Kadachana).',
        answerNepali: 'कर्ममा मात्र अधिकार छ, फलमा कहिल्यै छैन। निस्काम भावले कर्तव्य पालन गर्नु नै कर्मयोग हो।'
      }
    ],
    scripturalReferences: [
      { text: 'Bhagavad Gita', verse: '2.47', citation: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन' },
      { text: 'Bhagavad Gita', verse: '4.7', citation: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत' }
    ],
    relatedTopics: ['sanatan-dharma', 'upanishads', 'epics-ramayana-mahabharata'],
    featuredImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop',
    authoritativeSources: ['Bhagavad Gita SGIS Critical Text', 'Shankaracharya Bhashya']
  },
  'pashupatinath-nepal-traditions': {
    slug: 'pashupatinath-nepal-traditions',
    title: 'Pashupatinath & Himalayan Shaiva Traditions of Nepal',
    titleNepali: 'पशुपतिनाथ र नेपालको हिमाली शैव परम्परा',
    description: 'Explore the sacred geography of Nepal, Pashupatinath Temple, Himalayan Shaivism, Tantra, and ancient Newar Hindu festivals.',
    descriptionNepali: 'नेपालको पवित्र पशुपतिनाथ क्षेत्र, हिमाली शैव दर्शन, तन्त्र परम्परा र नेवार धार्मिक जात्रा।',
    category: 'Sacred Geography & Culture',
    pillarEntity: 'Pashupatinath Temple',
    keyQuestions: [
      {
        question: 'What makes Lord Pashupatinath central to Nepal Hindu heritage?',
        questionNepali: 'श्री पशुपतिनाथ नेपालको धार्मिक सभ्यतामा किन केन्द्रीय मानिन्छन्?',
        answer: 'Pashupatinath is the national deity of Nepal and one of the oldest Shaiva pilgrimage sites, representing Lord Shiva as master of all living beings.',
        answerNepali: 'पशुपतिनाथ नेपालका राष्ट्रदेव हुन्। यो क्षेत्र समस्त प्राणीका स्वामी पशुपतिको पवित्र निवास मानिन्छ।'
      }
    ],
    scripturalReferences: [
      { text: 'Himavat Khanda (Skanda Purana)', verse: 'Nepalamahatmya 1-12', citation: 'हिमाद्रिसदृशं स्थानं न भूतो न भविष्यति' }
    ],
    relatedTopics: ['sanatan-dharma', 'puranas', 'yoga-meditation'],
    featuredImage: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=1200&auto=format&fit=crop',
    authoritativeSources: ['Skanda Purana Himavat Khanda', 'Nepal Department of Archaeology & Culture']
  }
};
