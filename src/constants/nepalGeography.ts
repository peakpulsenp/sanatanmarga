/**
 * SANATANMARGA 5.0 — CANONICAL 12 NEWS CATEGORIES & NEPAL GEOGRAPHIC REGISTRY (7 PROVINCES & 77 DISTRICTS)
 * Supports localized news, Sanatan Radio regional distribution, civic information, and emergency updates.
 */

export interface CanonicalNewsCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameNe: string;
  order: number;
  descriptionNe: string;
  descriptionEn: string;
}

export const CANONICAL_12_CATEGORIES: CanonicalNewsCategory[] = [
  { id: "cat-politics", slug: "politics", nameEn: "Politics", nameNe: "राजनीति", order: 1, descriptionNe: "संसद, सरकार, दल र नीतिगत राजनीतिक घटनाक्रम", descriptionEn: "Parliament, government, governance, and policy" },
  { id: "cat-desh", slug: "desh", nameEn: "Desh", nameNe: "देश", order: 2, descriptionNe: "राष्ट्रिय सरोकार र देशभरका प्रमुख घटनाक्रम", descriptionEn: "National affairs and countrywide coverage" },
  { id: "cat-pradesh", slug: "pradesh", nameEn: "Pradesh", nameNe: "प्रदेश", order: 3, descriptionNe: "७ प्रदेश र ७७ जिल्लाका स्थानीय तथा प्रादेशिक समाचार", descriptionEn: "7 Provinces and 77 Districts localized coverage" },
  { id: "cat-bishwo", slug: "bishwo", nameEn: "Bishwo", nameNe: "विश्व", order: 4, descriptionNe: "अन्तर्राष्ट्रिय कूटनीति, भूराजनीति र विश्व घटनाक्रम", descriptionEn: "International diplomacy, geopolitics, and global affairs" },
  { id: "cat-economy", slug: "economy", nameEn: "Economy", nameNe: "अर्थ", order: 5, descriptionNe: "अर्थतन्त्र, बजेट, बैंकिङ, कृषि, उद्योग र व्यापार", descriptionEn: "Macroeconomy, fiscal policy, banking, agriculture, and trade" },
  { id: "cat-sports", slug: "sports", nameEn: "Sports", nameNe: "खेलकुद", order: 6, descriptionNe: "राष्ट्रिय तथा अन्तर्राष्ट्रिय खेलकुद र प्रतियोगिता", descriptionEn: "National and international sports coverage" },
  { id: "cat-entertainment", slug: "entertainment", nameEn: "Entertainment", nameNe: "मनोरञ्जन", order: 7, descriptionNe: "कला, साहित्य, चलचित्र र संगीत", descriptionEn: "Arts, literature, cinema, and music" },
  { id: "cat-tech", slug: "tech", nameEn: "Tech", nameNe: "प्रविधि", order: 8, descriptionNe: "विज्ञान, सूचना प्रविधि, नवप्रवर्तन र डिजिटल रूपान्तरण", descriptionEn: "Science, information technology, and digital innovation" },
  { id: "cat-sanskar", slug: "sanskar", nameEn: "Sanskar", nameNe: "संस्कार", order: 9, descriptionNe: "सनातन धर्म, संस्कृति, परम्परा, दर्शन र सम्पदा", descriptionEn: "Sanatan heritage, philosophy, traditions, and civilizational studies" },
  { id: "cat-tourism", slug: "tourism", nameEn: "Tourism", nameNe: "पर्यटन", order: 10, descriptionNe: "धार्मिक, सांस्कृतिक, साहसिक र प्राकृतिक पर्यटन", descriptionEn: "Pilgrimage, cultural, heritage, and eco-tourism" },
  { id: "cat-bichar", slug: "bichar", nameEn: "Bichar", nameNe: "विचार", order: 11, descriptionNe: "सम्पादकीय, विश्लेषण, स्तम्भ र विद्वत् विमर्श", descriptionEn: "Editorials, scholarly commentary, and opinion" },
  { id: "cat-development", slug: "development", nameEn: "Development", nameNe: "विकास", order: 12, descriptionNe: "पूर्वाधार, जलविद्युत्, शिक्षा, स्वास्थ्य र दिगो विकास", descriptionEn: "Infrastructure, hydropower, education, health, and sustainable development" },
];

export interface NepalProvince {
  id: string;
  provinceNumber: number;
  nameEn: string;
  nameNe: string;
  capitalEn: string;
  capitalNe: string;
  districtCount: number;
  radioRelayMhz: string;
}

export const NEPAL_PROVINCES: NepalProvince[] = [
  { id: "koshi", provinceNumber: 1, nameEn: "Koshi Province", nameNe: "कोशी प्रदेश", capitalEn: "Biratnagar", capitalNe: "विराटनगर", districtCount: 14, radioRelayMhz: "108.1 MHz" },
  { id: "madhesh", provinceNumber: 2, nameEn: "Madhesh Province", nameNe: "मधेश प्रदेश", capitalEn: "Janakpurdham", capitalNe: "जनकपुरधाम", districtCount: 8, radioRelayMhz: "108.2 MHz" },
  { id: "bagmati", provinceNumber: 3, nameEn: "Bagmati Province", nameNe: "बागमती प्रदेश", capitalEn: "Hetauda (Kathmandu Valley Hub)", capitalNe: "हेटौंडा (काठमाडौँ केन्द्र)", districtCount: 13, radioRelayMhz: "108.0 MHz" },
  { id: "gandaki", provinceNumber: 4, nameEn: "Gandaki Province", nameNe: "गण्डकी प्रदेश", capitalEn: "Pokhara", capitalNe: "पोखरा", districtCount: 11, radioRelayMhz: "108.4 MHz" },
  { id: "lumbini", provinceNumber: 5, nameEn: "Lumbini Province", nameNe: "लुम्बिनी प्रदेश", capitalEn: "Deukhuri", capitalNe: "देउखुरी", districtCount: 12, radioRelayMhz: "108.5 MHz" },
  { id: "karnali", provinceNumber: 6, nameEn: "Karnali Province", nameNe: "कर्णाली प्रदेश", capitalEn: "Birendranagar", capitalNe: "वीरेन्द्रनगर", districtCount: 10, radioRelayMhz: "108.6 MHz" },
  { id: "sudurpashchim", provinceNumber: 7, nameEn: "Sudurpashchim Province", nameNe: "सुदूरपश्चिम प्रदेश", capitalEn: "Godawari (Dhangadhi)", capitalNe: "गोदावरी (धनगढी)", districtCount: 9, radioRelayMhz: "108.7 MHz" },
];

export interface NepalDistrict {
  id: string;
  nameEn: string;
  nameNe: string;
  provinceId: string;
  provinceNumber: number;
  provinceNameEn: string;
  provinceNameNe: string;
  radioFrequencyMhz: string;
  emergencyHelpline: string;
}

const RAW_DISTRICTS: Array<{ id: string; nameNe: string; nameEn: string; provinceId: string }> = [
  // 1. Koshi (14)
  { id: "bhojpur", nameNe: "भोजपुर", nameEn: "Bhojpur", provinceId: "koshi" },
  { id: "dhankuta", nameNe: "धनकुटा", nameEn: "Dhankuta", provinceId: "koshi" },
  { id: "ilam", nameNe: "इलाम", nameEn: "Ilam", provinceId: "koshi" },
  { id: "jhapa", nameNe: "झापा", nameEn: "Jhapa", provinceId: "koshi" },
  { id: "khotang", nameNe: "खोटाङ", nameEn: "Khotang", provinceId: "koshi" },
  { id: "morang", nameNe: "मोरङ", nameEn: "Morang", provinceId: "koshi" },
  { id: "okhaldhunga", nameNe: "ओखलढुङ्गा", nameEn: "Okhaldhunga", provinceId: "koshi" },
  { id: "panchthar", nameNe: "पाँचथर", nameEn: "Panchthar", provinceId: "koshi" },
  { id: "sankhuwasabha", nameNe: "संखुवासभा", nameEn: "Sankhuwasabha", provinceId: "koshi" },
  { id: "solukhumbu", nameNe: "सोलुखुम्बु", nameEn: "Solukhumbu", provinceId: "koshi" },
  { id: "sunsari", nameNe: "सुनसरी", nameEn: "Sunsari", provinceId: "koshi" },
  { id: "taplejung", nameNe: "ताप्लेजुङ", nameEn: "Taplejung", provinceId: "koshi" },
  { id: "terhathum", nameNe: "तेह्रथुम", nameEn: "Terhathum", provinceId: "koshi" },
  { id: "udayapur", nameNe: "उदयपुर", nameEn: "Udayapur", provinceId: "koshi" },

  // 2. Madhesh (8)
  { id: "bara", nameNe: "बारा", nameEn: "Bara", provinceId: "madhesh" },
  { id: "dhanusha", nameNe: "धनुषा", nameEn: "Dhanusha", provinceId: "madhesh" },
  { id: "mahottari", nameNe: "महोत्तरी", nameEn: "Mahottari", provinceId: "madhesh" },
  { id: "parsa", nameNe: "पर्सा", nameEn: "Parsa", provinceId: "madhesh" },
  { id: "rautahat", nameNe: "रौतहट", nameEn: "Rautahat", provinceId: "madhesh" },
  { id: "saptari", nameNe: "सप्तरी", nameEn: "Saptari", provinceId: "madhesh" },
  { id: "sarlahi", nameNe: "सर्लाही", nameEn: "Sarlahi", provinceId: "madhesh" },
  { id: "siraha", nameNe: "सिराहा", nameEn: "Siraha", provinceId: "madhesh" },

  // 3. Bagmati (13)
  { id: "bhaktapur", nameNe: "भक्तपुर", nameEn: "Bhaktapur", provinceId: "bagmati" },
  { id: "chitwan", nameNe: "चितवन", nameEn: "Chitwan", provinceId: "bagmati" },
  { id: "dhading", nameNe: "धादिङ", nameEn: "Dhading", provinceId: "bagmati" },
  { id: "dolakha", nameNe: "दोलखा", nameEn: "Dolakha", provinceId: "bagmati" },
  { id: "kathmandu", nameNe: "काठमाडौँ", nameEn: "Kathmandu", provinceId: "bagmati" },
  { id: "kavrepalanchok", nameNe: "काभ्रेपलाञ्चोक", nameEn: "Kavrepalanchok", provinceId: "bagmati" },
  { id: "lalitpur", nameNe: "ललितपुर", nameEn: "Lalitpur", provinceId: "bagmati" },
  { id: "makwanpur", nameNe: "मकवानपुर", nameEn: "Makwanpur", provinceId: "bagmati" },
  { id: "nuwakot", nameNe: "नुवाकोट", nameEn: "Nuwakot", provinceId: "bagmati" },
  { id: "ramechhap", nameNe: "रामेछाप", nameEn: "Ramechhap", provinceId: "bagmati" },
  { id: "rasuwa", nameNe: "रसुवा", nameEn: "Rasuwa", provinceId: "bagmati" },
  { id: "sindhuli", nameNe: "सिन्धुली", nameEn: "Sindhuli", provinceId: "bagmati" },
  { id: "sindhupalchok", nameNe: "सिन्धुपाल्चोक", nameEn: "Sindhupalchok", provinceId: "bagmati" },

  // 4. Gandaki (11)
  { id: "baglung", nameNe: "बागलुङ", nameEn: "Baglung", provinceId: "gandaki" },
  { id: "gorkha", nameNe: "गोरखा", nameEn: "Gorkha", provinceId: "gandaki" },
  { id: "kaski", nameNe: "कास्की", nameEn: "Kaski", provinceId: "gandaki" },
  { id: "lamjung", nameNe: "लमजुङ", nameEn: "Lamjung", provinceId: "gandaki" },
  { id: "manang", nameNe: "मनाङ", nameEn: "Manang", provinceId: "gandaki" },
  { id: "mustang", nameNe: "मुस्ताङ", nameEn: "Mustang", provinceId: "gandaki" },
  { id: "myagdi", nameNe: "म्याग्दी", nameEn: "Myagdi", provinceId: "gandaki" },
  { id: "nawalpur", nameNe: "नवलपुर", nameEn: "Nawalpur", provinceId: "gandaki" },
  { id: "parbat", nameNe: "पर्वत", nameEn: "Parbat", provinceId: "gandaki" },
  { id: "syangja", nameNe: "स्याङ्जा", nameEn: "Syangja", provinceId: "gandaki" },
  { id: "tanahun", nameNe: "तनहुँ", nameEn: "Tanahun", provinceId: "gandaki" },

  // 5. Lumbini (12)
  { id: "arghakhanchi", nameNe: "अर्घाखाँची", nameEn: "Arghakhanchi", provinceId: "lumbini" },
  { id: "banke", nameNe: "बाँके", nameEn: "Banke", provinceId: "lumbini" },
  { id: "bardiya", nameNe: "बर्दिया", nameEn: "Bardiya", provinceId: "lumbini" },
  { id: "dang", nameNe: "दाङ", nameEn: "Dang", provinceId: "lumbini" },
  { id: "gulmi", nameNe: "गुल्मी", nameEn: "Gulmi", provinceId: "lumbini" },
  { id: "kapilvastu", nameNe: "कपिलवस्तु", nameEn: "Kapilvastu", provinceId: "lumbini" },
  { id: "parasi", nameNe: "परासी (पश्चिम नवलपरासी)", nameEn: "Parasi", provinceId: "lumbini" },
  { id: "palpa", nameNe: "पाल्पा", nameEn: "Palpa", provinceId: "lumbini" },
  { id: "pyuthan", nameNe: "प्युठान", nameEn: "Pyuthan", provinceId: "lumbini" },
  { id: "rolpa", nameNe: "रोल्पा", nameEn: "Rolpa", provinceId: "lumbini" },
  { id: "rukum_east", nameNe: "पूर्वी रुकुम", nameEn: "Eastern Rukum", provinceId: "lumbini" },
  { id: "rupandehi", nameNe: "रूपन्देही", nameEn: "Rupandehi", provinceId: "lumbini" },

  // 6. Karnali (10)
  { id: "dailekh", nameNe: "दैलेख", nameEn: "Dailekh", provinceId: "karnali" },
  { id: "dolpa", nameNe: "डोल्पा", nameEn: "Dolpa", provinceId: "karnali" },
  { id: "humla", nameNe: "हुम्ला", nameEn: "Humla", provinceId: "karnali" },
  { id: "jajarkot", nameNe: "जाजरकोट", nameEn: "Jajarkot", provinceId: "karnali" },
  { id: "jumla", nameNe: "जुम्ला", nameEn: "Jumla", provinceId: "karnali" },
  { id: "kalikot", nameNe: "कालिकोट", nameEn: "Kalikot", provinceId: "karnali" },
  { id: "mugu", nameNe: "मुगु", nameEn: "Mugu", provinceId: "karnali" },
  { id: "salyan", nameNe: "सल्यान", nameEn: "Salyan", provinceId: "karnali" },
  { id: "surkhet", nameNe: "सुर्खेत", nameEn: "Surkhet", provinceId: "karnali" },
  { id: "rukum_west", nameNe: "पश्चिम रुकुम", nameEn: "Western Rukum", provinceId: "karnali" },

  // 7. Sudurpashchim (9)
  { id: "achham", nameNe: "अछाम", nameEn: "Achham", provinceId: "sudurpashchim" },
  { id: "baitadi", nameNe: "बैतडी", nameEn: "Baitadi", provinceId: "sudurpashchim" },
  { id: "bajhang", nameNe: "बझाङ", nameEn: "Bajhang", provinceId: "sudurpashchim" },
  { id: "bajura", nameNe: "बाजुरा", nameEn: "Bajura", provinceId: "sudurpashchim" },
  { id: "dadeldhura", nameNe: "डडेल्धुरा", nameEn: "Dadeldhura", provinceId: "sudurpashchim" },
  { id: "darchula", nameNe: "दार्चुला", nameEn: "Darchula", provinceId: "sudurpashchim" },
  { id: "doti", nameNe: "डोटी", nameEn: "Doti", provinceId: "sudurpashchim" },
  { id: "kailali", nameNe: "कैलाली", nameEn: "Kailali", provinceId: "sudurpashchim" },
  { id: "kanchanpur", nameNe: "कञ्चनपुर", nameEn: "Kanchanpur", provinceId: "sudurpashchim" },
];

export const NEPAL_77_DISTRICTS: NepalDistrict[] = RAW_DISTRICTS.map((d) => {
  const prov = NEPAL_PROVINCES.find((p) => p.id === d.provinceId)!;
  return {
    id: d.id,
    nameEn: d.nameEn,
    nameNe: d.nameNe,
    provinceId: d.provinceId,
    provinceNumber: prov.provinceNumber,
    provinceNameEn: prov.nameEn,
    provinceNameNe: prov.nameNe,
    radioFrequencyMhz: prov.radioRelayMhz,
    emergencyHelpline: "1149 (NDRRMA) / 100",
  };
});

