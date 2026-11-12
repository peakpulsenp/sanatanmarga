import type { TodayObject, DistrictIntelligenceNode, VedicAudioItem } from '../types/today';

export interface DailyNepalPackage {
  dateBS?: string;
  panchang: {
    dateBS: string;
    weekday: string;
    tithi: string;
    nakshatra: string;
    sunrise: string;
    sunset: string;
    vratOrParba?: string;
    saait?: string;
  };
  districtHighlights: {
    id: string;
    name: string;
    nameNepali: string;
    provinceNepali: string;
    agricultureNotes: string;
    tourismHighlights: string;
    weatherSummary: string;
    localNotices?: any[];
  }[];
  marketPulse: {
    items: {
      id: string;
      nameNepali: string;
      buy: string;
      source: string;
      change: string;
      verifiedState: string;
    }[];
    aiAnalysis?: string;
    localizedAgri?: string;
  };
  intelligenceGraphNode: {
    connections: string[];
  };
  dailyBulletin?: {
    title: string;
    summary: string;
    summaryNepali?: string;
    audioDuration: string;
    bulletinPoints: string[];
  };
  topNews?: {
    id: string;
    title: string;
    titleNepali?: string;
    summary: string;
    category?: string;
    source?: string;
  }[];
}

export const TodayEngine = {
  getTodayPackage(): DailyNepalPackage {
    return {
      dateBS: "भदौ १३, २०८३",
      panchang: {
        dateBS: "भदौ १३, २०८३",
        weekday: "बिहीवार",
        tithi: "शुक्ल पक्ष द्वितीया",
        nakshatra: "उत्तराफाल्गुनी",
        sunrise: "05:32 AM",
        sunset: "06:45 PM",
        vratOrParba: "श्रीकृष्ण जन्माष्टमी उत्सव",
        saait: "बिहान ०६:१५ देखि ०८:०० बजेसम्म (शुभ)"
      },
      districtHighlights: [
        { 
          id: "ktm", 
          name: "Kathmandu", 
          nameNepali: "काठमाडौं", 
          provinceNepali: "बागमती प्रदेश", 
          agricultureNotes: "कालीमाटी बजारमा तरकारी तथा फलफूल आपूर्ति सहज।", 
          tourismHighlights: "पशुपतिनाथ र स्वयम्भूनाथमा दर्शनार्थीहरूको घुइँचो।", 
          weatherSummary: "आंशिक बदली, हल्का घमाइलो।",
          localNotices: [{ title: "काठमाडौं महानगरपालिकाद्वारा चाडपर्व लक्षित बजार अनुगमन तीव्र।" }]
        },
        { 
          id: "pkr", 
          name: "Pokhara", 
          nameNepali: "पोखरा (कास्की)", 
          provinceNepali: "गण्डकी प्रदेश", 
          agricultureNotes: "धान रोपाइँ सम्पन्न, मौसमी तरकारी खेती प्रवर्द्धन।", 
          tourismHighlights: "फेवाताल किनारामा पर्यटकहरूको चहलपहल बढ्दो।", 
          weatherSummary: "सफा तथा अनुकूल मौसम।",
          localNotices: [{ title: "पोखरा महानगरपालिकाद्वारा पर्यटन सुरक्षा निर्देशिका जारी।" }]
        },
        { 
          id: "dlk", 
          name: "Dailekh", 
          nameNepali: "दैलेख", 
          provinceNepali: "कर्णाली प्रदेश", 
          agricultureNotes: "स्थानीय बाली संरक्षण तथा सिँचाइ व्यवस्थापन।", 
          tourismHighlights: "पञ्चकोशी तीर्थस्थलमा दर्शनार्थीहरूको आवागमन।", 
          weatherSummary: "घमाइलो र सफा।",
          localNotices: [{ title: "दैलेख जिल्ला प्रशासन कार्यालयद्वारा पर्व सुरक्षा बैठक सम्पन्न।" }]
        }
      ],
      marketPulse: {
        items: [
          { id: "usd", nameNepali: "अमेरिकी डलर ($1)", buy: "135.10", source: "NRB", change: "+0.20", verifiedState: "Verified" },
          { id: "eur", nameNepali: "युरो (€1)", buy: "145.80", source: "NRB", change: "+0.15", verifiedState: "Verified" },
          { id: "hydro", nameNepali: "राष्ट्रिय जलविद्युत् उत्पादन", buy: "3,140 MW", source: "NEA", change: "Stable", verifiedState: "Verified" }
        ],
        aiAnalysis: "नेपाल राष्ट्र बैंकको विदेशी विनिमय सञ्चिति र जलविद्युत् उत्पादन उच्च स्तरमा कायम रहेको छ।",
        localizedAgri: "कृषि उपजको ढुवानी सुचारु।"
      },
      intelligenceGraphNode: {
        connections: [
          "Festival (Krishna Janmashtami) → Panchang Detector",
          "District Intelligence → Kathmandu Valley Security",
          "Civic & Economic Pulse → NRB Forex & NEA Hydro Grid",
          "ListenOS → Daily Audio Bulletin (8m)"
        ]
      },
      dailyBulletin: {
        title: 'आजको सनातनमार्ग — ८ मिनेट विशेष श्रव्य बुलेटिन',
        summary: 'श्रीकृष्ण जन्माष्टमी उत्सवको तयारी, राष्ट्र बैंकको आर्थिक समीक्षा र ७७ जिल्लाको स्थानीय ताजा अपडेट।',
        summaryNepali: 'श्रीकृष्ण जन्माष्टमी उत्सवको तयारी, राष्ट्र बैंकको आर्थिक समीक्षा र ७७ जिल्लाको स्थानीय ताजा अपडेट।',
        audioDuration: '०८:१५ मिनेट',
        bulletinPoints: [
          'काठमाडौं उपत्यकासहित देशैभर श्रीकृष्ण जन्माष्टमी भव्य रूपमा मनाइँदै।',
          'नेपाल राष्ट्र बैंकले जारी गर्यो मौद्रिक नीतिको त्रैमासिक समीक्षा।',
          'राष्ट्रिय जलविद्युत् ग्रिडमा ३,१४० मेगावाट उत्पादन, प्रसारण लाइन सुचारु।',
          '७७ वटै जिल्लामा चाडपर्व लक्षित विशेष प्रशासनिक निगरानी सुरु।'
        ]
      },
      topNews: [
        { id: 'tn-1', title: 'श्रीकृष्ण जन्माष्टमी उत्सवको भव्य तयारी', titleNepali: 'श्रीकृष्ण जन्माष्टमी उत्सवको भव्य तयारी', summary: 'काठमाडौंको पाटन कृष्ण मन्दिरमा विशेष पूजाआजाको प्रबन्ध।', category: 'संस्कृति', source: 'सनातन न्युज' },
        { id: 'tn-2', title: 'राष्ट्र बैंकको मौद्रिक नीति समीक्षा', titleNepali: 'राष्ट्र बैंकको मौद्रिक नीति समीक्षा', summary: 'ब्याजदर स्थायित्व र कृषि ऋणमा सहजता।', category: 'अर्थतन्त्र', source: 'राष्ट्र बैंक' }
      ]
    };
  },
  async playTodayAudioEdition() {
    return new Promise(resolve => setTimeout(resolve, 3000));
  }
};

export const ALL_77_DISTRICTS: { id: string; nameNepali: string; nameEnglish: string; province: string }[] = [
  // Province 1 / Koshi
  { id: 'bhojpur', nameNepali: 'भोजपुर', nameEnglish: 'Bhojpur', province: 'Koshi' },
  { id: 'dhankuta', nameNepali: 'धनकुटा', nameEnglish: 'Dhankuta', province: 'Koshi' },
  { id: 'ilhham', nameNepali: 'इलाम', nameEnglish: 'Ilam', province: 'Koshi' },
  { id: 'jhapa', nameNepali: 'झापा', nameEnglish: 'Jhapa', province: 'Koshi' },
  { id: 'khotang', nameNepali: 'खोटाङ', nameEnglish: 'Khotang', province: 'Koshi' },
  { id: 'morang', nameNepali: 'मोरङ', nameEnglish: 'Morang', province: 'Koshi' },
  { id: 'okhaldhunga', nameNepali: 'ओखढुङ्गा', nameEnglish: 'Okhaldhunga', province: 'Koshi' },
  { id: 'panchthar', nameNepali: 'पाँचथर', nameEnglish: 'Panchthar', province: 'Koshi' },
  { id: 'sankhuwasabha', nameNepali: 'संखुवासभा', nameEnglish: 'Sankhuwasabha', province: 'Koshi' },
  { id: 'solukhumbu', nameNepali: 'सोलुखुम्बु', nameEnglish: 'Solukhumbu', province: 'Koshi' },
  { id: 'sunsari', nameNepali: 'सुनसरी', nameEnglish: 'Sunsari', province: 'Koshi' },
  { id: 'taplejung', nameNepali: 'ताप्लेजुङ', nameEnglish: 'Taplejung', province: 'Koshi' },
  { id: 'terhathum', nameNepali: 'तेह्रथुम', nameEnglish: 'Terhathum', province: 'Koshi' },
  { id: 'udayapur', nameNepali: 'उदयपुर', nameEnglish: 'Udayapur', province: 'Koshi' },

  // Madhesh
  { id: 'bara', nameNepali: 'बारा', nameEnglish: 'Bara', province: 'Madhesh' },
  { id: 'dhanusha', nameNepali: 'धनुषा', nameEnglish: 'Dhanusha', province: 'Madhesh' },
  { id: 'mahottari', nameNepali: 'महोत्तरी', nameEnglish: 'Mahottari', province: 'Madhesh' },
  { id: 'persia', nameNepali: 'पर्सा', nameEnglish: 'Parsa', province: 'Madhesh' },
  { id: 'rautahat', nameNepali: 'रौतहट', nameEnglish: 'Rautahat', province: 'Madhesh' },
  { id: 'saptari', nameNepali: 'सप्तरी', nameEnglish: 'Saptari', province: 'Madhesh' },
  { id: 'sarlahi', nameNepali: 'सर्लाही', nameEnglish: 'Sarlahi', province: 'Madhesh' },
  { id: 'siraha', nameNepali: 'सिराहा', nameEnglish: 'Siraha', province: 'Madhesh' },

  // Bagmati
  { id: 'bhaktapur', nameNepali: 'भक्तपुर', nameEnglish: 'Bhaktapur', province: 'Bagmati' },
  { id: 'chitwan', nameNepali: 'चितवन', nameEnglish: 'Chitwan', province: 'Bagmati' },
  { id: 'dhading', nameNepali: 'धादिङ', nameEnglish: 'Dhading', province: 'Bagmati' },
  { id: 'dolakha', nameNepali: 'दोलखा', nameEnglish: 'Dolakha', province: 'Bagmati' },
  { id: 'kathmandu', nameNepali: 'काठमाडौं', nameEnglish: 'Kathmandu', province: 'Bagmati' },
  { id: 'kavrepalanchok', nameNepali: 'काभ्रेपलाञ्चोक', nameEnglish: 'Kavrepalanchok', province: 'Bagmati' },
  { id: 'lalitpur', nameNepali: 'ललितपुर', nameEnglish: 'Lalitpur', province: 'Bagmati' },
  { id: 'makwanpur', nameNepali: 'मकवानपुर', nameEnglish: 'Makwanpur', province: 'Bagmati' },
  { id: 'nuwakot', nameNepali: 'नुवाकोट', nameEnglish: 'Nuwakot', province: 'Bagmati' },
  { id: 'ramechhap', nameNepali: 'रामेछाप', nameEnglish: 'Ramechhap', province: 'Bagmati' },
  { id: 'rasuwa', nameNepali: 'रसुवा', nameEnglish: 'Rasuwa', province: 'Bagmati' },
  { id: 'sindhuli', nameNepali: 'सिन्धुली', nameEnglish: 'Sindhuli', province: 'Bagmati' },
  { id: 'sindhupalchok', nameNepali: 'सिन्धुपाल्चोक', nameEnglish: 'Sindhupalchok', province: 'Bagmati' },

  // Gandaki
  { id: 'baglung', nameNepali: 'बागलुङ', nameEnglish: 'Baglung', province: 'Gandaki' },
  { id: 'gorkha', nameNepali: 'गोर्खा', nameEnglish: 'Gorkha', province: 'Gandaki' },
  { id: 'kaski', nameNepali: 'कास्की', nameEnglish: 'Kaski', province: 'Gandaki' },
  { id: 'lamjung', nameNepali: 'लमजुङ', nameEnglish: 'Lamjung', province: 'Gandaki' },
  { id: 'manang', nameNepali: 'मनाङ', nameEnglish: 'Manang', province: 'Gandaki' },
  { id: 'mustang', nameNepali: 'मुस्ताङ', nameEnglish: 'Mustang', province: 'Gandaki' },
  { id: 'myagdi', nameNepali: 'म्याग्दी', nameEnglish: 'Myagdi', province: 'Gandaki' },
  { id: 'nawalpur', nameNepali: 'नवलपुर', nameEnglish: 'Nawalpur (East Gandaki)', province: 'Gandaki' },
  { id: 'parbat', nameNepali: 'पर्वत', nameEnglish: 'Parbat', province: 'Gandaki' },
  { id: 'syangja', nameNepali: 'स्याङ्जा', nameEnglish: 'Syangja', province: 'Gandaki' },
  { id: 'tanahun', nameNepali: 'तनहुँ', nameEnglish: 'Tanahun', province: 'Gandaki' },

  // Lumbini
  { id: 'arghakhanchi', nameNepali: 'अर्घाखाँची', nameEnglish: 'Arghakhanchi', province: 'Lumbini' },
  { id: 'banke', nameNepali: 'बाँके', nameEnglish: 'Banke', province: 'Lumbini' },
  { id: 'bardiya', nameNepali: 'बर्दिया', nameEnglish: 'Bardiya', province: 'Lumbini' },
  { id: 'dang', nameNepali: 'दाङ', nameEnglish: 'Dang', province: 'Lumbini' },
  { id: 'gulmi', nameNepali: 'गुल्मी', nameEnglish: 'Gulmi', province: 'Lumbini' },
  { id: 'kapilvastu', nameNepali: 'कपिलवस्तु', nameEnglish: 'Kapilvastu', province: 'Lumbini' },
  { id: 'parasi', nameNepali: 'पश्चिम नवलपरासी', nameEnglish: 'Parasi', province: 'Lumbini' },
  { id: 'palpa', nameNepali: 'पाल्पा', nameEnglish: 'Palpa', province: 'Lumbini' },
  { id: 'pyuthan', nameNepali: 'प्युठान', nameEnglish: 'Pyuthan', province: 'Lumbini' },
  { id: 'rolpa', nameNepali: 'रोल्पा', nameEnglish: 'Rolpa', province: 'Lumbini' },
  { id: 'rukum_east', nameNepali: 'पूर्वी रुकुम', nameEnglish: 'Eastern Rukum', province: 'Lumbini' },
  { id: 'rupandehi', nameNepali: 'रूपन्देही', nameEnglish: 'Rupandehi', province: 'Lumbini' },

  // Karnali
  { id: 'dailekh', nameNepali: 'दैलेख', nameEnglish: 'Dailekh', province: 'Karnali' },
  { id: 'dolpa', nameNepali: 'डोल्पा', nameEnglish: 'Dolpa', province: 'Karnali' },
  { id: 'humla', nameNepali: 'हुम्ला', nameEnglish: 'Humla', province: 'Karnali' },
  { id: 'jajarkot', nameNepali: 'जाजरकोट', nameEnglish: 'Jajarkot', province: 'Karnali' },
  { id: 'jumla', nameNepali: 'जुम्ला', nameEnglish: 'Jumla', province: 'Karnali' },
  { id: 'kalikot', nameNepali: 'कालिकोट', nameEnglish: 'Kalikot', province: 'Karnali' },
  { id: 'mugu', nameNepali: 'मुगु', nameEnglish: 'Mugu', province: 'Karnali' },
  { id: 'salyan', nameNepali: 'सल्यान', nameEnglish: 'Salyan', province: 'Karnali' },
  { id: 'surkhet', nameNepali: 'सुर्खेत', nameEnglish: 'Surkhet', province: 'Karnali' },
  { id: 'rukum_west', nameNepali: 'पश्चिम रुकुम', nameEnglish: 'Western Rukum', province: 'Karnali' },

  // Sudurpashchim
  { id: 'achham', nameNepali: 'अछाम', nameEnglish: 'Achham', province: 'Sudurpashchim' },
  { id: 'baitadi', nameNepali: 'बैतडी', nameEnglish: 'Baitadi', province: 'Sudurpashchim' },
  { id: 'bajhang', nameNepali: 'बझाङ', nameEnglish: 'Bajhang', province: 'Sudurpashchim' },
  { id: 'bajura', nameNepali: 'बाजुरा', nameEnglish: 'Bajura', province: 'Sudurpashchim' },
  { id: 'dadeldhura', nameNepali: 'डडेल्धुरा', nameEnglish: 'Dadeldhura', province: 'Sudurpashchim' },
  { id: 'darchula', nameNepali: 'दार्चुला', nameEnglish: 'Darchula', province: 'Sudurpashchim' },
  { id: 'doti', nameNepali: 'डोटी', nameEnglish: 'Doti', province: 'Sudurpashchim' },
  { id: 'kailali', nameNepali: 'कैलाली', nameEnglish: 'Kailali', province: 'Sudurpashchim' },
  { id: 'kanchanpur', nameNepali: 'कञ्चनपुर', nameEnglish: 'Kanchanpur', province: 'Sudurpashchim' },
];

export const MOCK_VEDIC_AUDIOS: VedicAudioItem[] = [
  {
    id: 'va-1',
    title: 'श्रीकृष्ण अमृत वाणी एवं कृष्णमष्टकम्',
    language: 'Sanskrit / Nepali',
    script: 'Devanagari',
    tradition: 'Sanatan Vedic',
    deityOrTopic: 'Lord Krishna',
    duration: '08:45',
    source: 'Sanatan Archive V3',
    transliteration: 'Vasudevasutam devam Kansachanakamardanam...',
    meaning: 'Salutations to Lord Krishna, son of Vasudeva, who vanquished Kansa and Chanaka.',
    collection: 'Stotra',
    audioVersion: 'Studio Master HD',
    provenance: 'Traditional Recitation - Kashi Parishad',
    membershipTier: 'Free'
  },
  {
    id: 'va-2',
    title: 'रुद्र सूक्तम (वैदिक मन्त्र)',
    language: 'Vedic Sanskrit',
    script: 'Devanagari',
    tradition: 'Yajurveda',
    deityOrTopic: 'Shiva / Rudra',
    duration: '12:20',
    source: 'Vedic Sound Lab Nepal',
    transliteration: 'Om namo bhagavate rudraya...',
    meaning: 'Invoke the cosmic healing resonance of Rudra for peace and protection.',
    collection: 'Veda',
    audioVersion: 'Acoustic Pure',
    provenance: 'Pashupatinath Veda Pathshala',
    membershipTier: 'Member'
  },
  {
    id: 'va-3',
    title: 'गायत्री मन्त्र ध्यानम् (108 आवृति)',
    language: 'Sanskrit',
    script: 'Devanagari',
    tradition: 'Rigveda',
    deityOrTopic: 'Savita / Gayatri',
    duration: '15:00',
    source: 'Sanatan Meditation Hub',
    transliteration: 'Om bhur bhuvah svah tat savitur varenyam...',
    meaning: 'Meditation on the divine light of the supreme sun to illumine our intellect.',
    collection: 'Mantra',
    audioVersion: 'Chant Master',
    provenance: 'Ancient Gurukul Oral Tradition',
    membershipTier: 'Free'
  },
  {
    id: 'va-4',
    title: 'आदित्य हृदय स्तोत्रम्',
    language: 'Sanskrit',
    script: 'Devanagari',
    tradition: 'Valmiki Ramayana',
    deityOrTopic: 'Surya Dev',
    duration: '09:15',
    source: 'Dharma Audio Archives',
    transliteration: 'Tato yuddhaparishrantam samare chintaya sthitam...',
    meaning: 'The holy stotra imparted by Sage Agastya to Lord Rama for victory over adversity.',
    collection: 'Stotra',
    audioVersion: 'High Clarity',
    provenance: 'Janakpur Sanskrit Academy',
    membershipTier: 'Premium'
  }
];

export function getTodayObject(): TodayObject {
  return {
    dateKey: '2083-05-13',
    calendar: {
      bsDate: 'भदौ १३, २०८३',
      adDate: 'August 28, 2026',
      dayOfWeek: 'बिहीवार',
      tithi: 'शुक्ल पक्ष द्वितीया',
      nakshatra: 'उत्तराफाल्गुनी (सहित ब्रह्म योग)',
      yoga: 'ब्रह्म योग',
      karana: 'बालव करण',
      sunrise: '05:32 AM',
      sunset: '06:45 PM',
      festivals: ['श्रीकृष्ण जन्माष्टमी विशेष उत्सव', 'ऋषिपञ्चमी पूर्वसन्ध्या अनुष्ठान']
    },
    nationalIntelligence: [
      {
        id: 'ni-1',
        category: 'economy',
        title: 'नेपाल राष्ट्र बैंकद्वारा मौद्रिक नीतिको पहिलो त्रैमासिक समीक्षा सार्वजनिक',
        summary: 'तरलतातर्फ सहजता आउँदै गर्दा ब्याजदरमा देखिएको स्थायित्व र कृषि ऋण प्रवाहमा विशेष सहुलियत घोषणा।',
        source: 'NRB Economic Intelligence',
        timeAgo: '४२ मिनेट अगाडि',
        whyItMatters: 'व्यापारिक कर्जाको लागत घट्न सक्ने र साना उद्यमीलाई सहुलियत दरमा लगानी प्राप्त हुने सम्भावना।',
        impactScore: 88
      },
      {
        id: 'ni-2',
        category: 'society',
        title: 'काठमाडौं उपत्यकामा श्रीकृष्ण जन्माष्टमीको भव्य शोभायात्राको तयारी पूरा',
        summary: 'पाटनको कृष्ण मन्दिर र हनुमानढोकामा हजारौं भक्तजनको सहभागिता रहने गरी सुरक्षा तथा यातायात व्यवस्थापन मिलाइएको छ।',
        source: 'District Administration Office Kathmandu',
        timeAgo: '१ घण्टा अगाडि',
        whyItMatters: 'सांस्कृतिक पर्यटन प्रवर्द्धनका साथै उपत्यकाको सार्वजनिक यातायात रुटमा डाइभर्ट लागू गरिएको छ।',
        impactScore: 92
      },
      {
        id: 'ni-3',
        category: 'technology',
        title: 'नेपाल सरकारद्वारा डिजिटल नागरिक एपमा कृत्रिम बौद्धिकता (AI) सेवा विस्तार',
        summary: 'नागरिक सेवाहरू अब नेपालका प्रमुख स्थानीय भाषाहरूमा भ्वाइस असिस्टेन्टमार्फत प्राप्त गर्न सकिने।',
        source: 'MoICT Nepal',
        timeAgo: '३ घण्टा अगाडि',
        whyItMatters: 'सरकारी कार्यालय धाउनुपर्ने बाध्यता हट्दै डिजिटल सेवामा पहुँच सहज बन्दै गएको छ।',
        impactScore: 78
      }
    ],
    districtsIntelligence: ALL_77_DISTRICTS.map((d, index) => {
      const activity: 'High' | 'Moderate' | 'Emerging' = index % 3 === 0 ? 'High' : index % 2 === 0 ? 'Moderate' : 'Emerging';
      const score = 50 + ((index * 37) % 45);
      return {
        districtId: d.id,
        districtNameNepali: d.nameNepali,
        districtNameEnglish: d.nameEnglish,
        province: d.province,
        intelligenceActivity: activity,
        activityScore: score,
        metrics: {
          newsCount: 4 + (index % 12),
          govtNoticesCount: 1 + (index % 4),
          marketActivity: index % 2 === 0 ? 'स्थिर र चलायमान' : 'सामान्य कारोबार',
          agriStatus: index % 3 === 0 ? 'धान रोपाइँ तथा गोडमेल सम्पन्न' : 'मौसमी बाली संरक्षण कार्य',
          tourismStatus: index % 4 === 0 ? 'पर्यटक आवागमन उत्साहजनक' : 'सामान्य मौसमी स्थिति',
          weatherAlert: index % 5 === 0 ? 'मध्यम वर्षाको सम्भावना' : 'मौसम सामान्य र सफा'
        },
        latestLocalNotice: `${d.nameNepali} जिल्ला प्रशासन कार्यालयद्वारा चाडपर्व लक्षित सुरक्षा तथा बजार अनुगमन तीव्र बनाइएको सूचना जारी।`
      };
    }),
    marketPulse: {
      forexRates: {
        usd: 'रू १३४.५० (खरीद) / १३५.१० (विक्री)',
        eur: 'रू १४५.८०',
        gbp: 'रू १७६.४०',
        inr: 'रू १.६० (स्थिर)'
      },
      civicIndicators: {
        hydroGeneration: '३,१४० MW (राष्ट्रीय ग्रिड)',
        remittanceInflow: '+१६.५% (NRB प्रतिवेदन)',
        provincesCovered: '७ प्रदेश / ७७ जिल्ला'
      },
      whyItMattersMarket: 'विदेशी विनिमय सञ्चिति सुदृढ रहँदा आयात भुक्तानी सहज बनेको छ र जलविद्युत् उत्पादनले औद्योगिक आपूर्ति स्थिर बनाएको छ।'
    },
    dharmaCulture: {
      dailyMantra: {
        sanskrit: 'ॐ कृष्णाय वासुदेवाय हरये परमात्मने। प्रणतक्लेशनाशाय गोविन्दाय नमो नमः॥',
        transliteration: 'Om Krishnaya Vasudevaya Haraye Paramatmane. Pranatakleshanashaya Govindaya namo namah.',
        meaning: 'Salutations to Lord Krishna, the son of Vasudeva, the supreme remover of all distress and the protector of cows and nature.',
        deity: 'Lord Krishna'
      },
      dailyStotra: {
        title: 'अच्युताष्टकम् (श्रीकृष्ण स्तोत्र)',
        excerpt: 'अच्युतं केशव रामनारायणं कृष्णदामोदरं वासुदेवं हरिम्। श्रीधरं माधवं गोपिकावल्लभं जानकीनायकं रामचन्द्रं भजे॥'
      }
    },
    whatChangedDeltas: [
      {
        id: 'wc-1',
        category: 'अर्थतन्त्र (Economy)',
        yesterdayState: 'अमेरिकी डलर (USD) खरिद दर रू १३४.३०',
        todayState: 'अमेरिकी डलर (USD) खरिद दर रू १३४.५० (+०.२०)',
        deltaImpact: 'नेपाल राष्ट्र बैंकको विनिमय दर अद्यावधिक, रेमिट्यान्स प्रवाहमा उत्साह',
        timestamp: 'आज बिहान ६:०० बजे'
      },
      {
        id: 'wc-2',
        category: 'प्रशासन (Administration)',
        yesterdayState: 'चाडपर्व सुरक्षा निर्देशिका मस्यौदा चरणमा',
        todayState: 'गृह मन्त्रालयद्वारा ७७ वटै जिल्लामा विशेष सुरक्षा सिलिङ लागू',
        deltaImpact: 'रात्रि बजार तथा सार्वजनिक यातायातमा सुरक्षा सुदृढ',
        timestamp: 'आज बिहान ७:३० बजे'
      },
      {
        id: 'wc-3',
        category: 'मौसम (Weather & Agri)',
        yesterdayState: 'पहाडी क्षेत्रमा छिटपुट वर्षा',
        todayState: 'अधिकांश क्षेत्रमा मौसम सफा र कृषियोग्य अनुकूल घमाइलो',
        deltaImpact: 'धान गोडमेल तथा कृषि उपज ढुवानीमा सहजता',
        timestamp: 'आज बिहान ५:०० बजे'
      }
    ],
    dailyBulletin: {
      title: 'आजको सनातनमार्ग — ८ मिनेट विशेष श्रव्य बुलेटिन',
      summary: 'श्रीकृष्ण जन्माष्टमी उत्सवको तयारी, राष्ट्र बैंकको आर्थिक समीक्षा र ७७ जिल्लाको स्थानीय ताजा अपडेट।',
      audioDuration: '०८:१५ मिनेट',
      bulletinPoints: [
        'काठमाडौं उपत्यकासहित देशैभर श्रीकृष्ण जन्माष्टमी भव्य रूपमा मनाइँदै।',
        'नेपाल राष्ट्र बैंकले जारी गर्यो मौद्रिक नीतिको त्रैमासिक समीक्षा।',
        'राष्ट्रिय जलविद्युत् ग्रिडमा ३,१४० मेगावाट उत्पादन, प्रसारण लाइन सुचारु।',
        '७७ वटै जिल्लामा चाडपर्व लक्षित विशेष प्रशासनिक निगरानी सुरु।'
      ]
    }
  };
}
