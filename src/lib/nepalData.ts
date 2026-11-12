export interface ProvinceInfo {
  id: number;
  name: string;
  nameEn: string;
  slug: string;
  districts: string[];
  districtsEn: string[];
}

export const provinces: ProvinceInfo[] = [
  {
    id: 1,
    name: "कोशी प्रदेश",
    nameEn: "Koshi Province",
    slug: "koshi",
    districts: ["भोजपुर", "धनकुटा", "इलाम", "झापा", "खोटाङ", "मोरङ", "ओखलढुङ्गा", "पाँचथर", "संखुवासभा", "सोलुखुम्बु", "सुनसरी", "ताप्लेजुङ", "तेह्रथुम", "उदयपुर"],
    districtsEn: ["Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"]
  },
  {
    id: 2,
    name: "मधेश प्रदेश",
    nameEn: "Madhesh Province",
    slug: "madesh",
    districts: ["बारा", "धनुषा", "महोत्तरी", "पर्सा", "रौतहट", "सप्तरी", "सर्लाही", "सिरहा"],
    districtsEn: ["Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"]
  },
  {
    id: 3,
    name: "बागमती प्रदेश",
    nameEn: "Bagmati Province",
    slug: "bagmati",
    districts: ["भक्तपुर", "चितवन", "धादिङ", "दोलखा", "काठमाडौं", "काभ्रेपलान्चोक", "ललितपुर", "मकवानपुर", "नुवाकोट", "रामेछाप", "रसुवा", "सिन्धुली", "सिन्धुपाल्चोक"],
    districtsEn: ["Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"]
  },
  {
    id: 4,
    name: "गण्डकी प्रदेश",
    nameEn: "Gandaki Province",
    slug: "gandaki",
    districts: ["बागलुङ", "गोरखा", "कास्की", "लमजुङ", "मनाङ", "मुस्ताङ", "म्याग्दी", "नवलपुर", "पर्वत", "स्याङ्जा", "तनहुँ"],
    districtsEn: ["Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun"]
  },
  {
    id: 5,
    name: "लुम्बिनी प्रदेश",
    nameEn: "Lumbini Province",
    slug: "lumbini",
    districts: ["अर्घाखाँची", "बाँके", "बर्दिया", "दाङ", "गुल्मी", "कपिलवस्तु", "परासी", "पाल्पा", "प्युठान", "रोल्पा", "पूर्वी रुकुम", "रुपन्देही"],
    districtsEn: ["Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Parasi", "Palpa", "Pyuthan", "Rolpa", "Eastern Rukum", "Rupandehi"]
  },
  {
    id: 6,
    name: "कर्णाली प्रदेश",
    nameEn: "Karnali Province",
    slug: "karnali",
    districts: ["दैलेख", "डोल्पा", "हुम्ला", "जाजरकोट", "जुम्ला", "कालीकोट", "मुगु", "सल्यान", "सुर्खेत", "पश्चिमी रुकुम"],
    districtsEn: ["Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Salyan", "Surkhet", "Western Rukum"]
  },
  {
    id: 7,
    name: "सुदूरपश्चिम प्रदेश",
    nameEn: "Sudurpashchim Province",
    slug: "sudurpashchim",
    districts: ["अछाम", "बैतडी", "बझाङ", "बाजुरा", "डडेल्धुरा", "दार्चुला", "डोटी", "कैलाली", "कञ्चनपुर"],
    districtsEn: ["Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"]
  }
];

export const districtTranslations: Record<string, { np: string; en: string }> = {
  "काठमाडौँ": { np: "काठमाडौँ", en: "Kathmandu" },
  "काठमाडौं": { np: "काठमाडौं", en: "Kathmandu" },
  "पोखरा": { np: "पोखरा", en: "Pokhara" },
  "कास्की": { np: "कास्की", en: "Kaski" },
  "ललितपुर": { np: "ललितपुर", en: "Lalitpur" },
  "भक्तपुर": { np: "भक्तपुर", en: "Bhaktapur" },
  "जनकपुरधाम": { np: "जनकपुरधाम", en: "Janakpurdham" },
  "धनुषा": { np: "धनुषा", en: "Dhanusha" },
  "बुटवल": { np: "बुटवल", en: "Butwal" },
  "रुपन्देही": { np: "रुपन्देही", en: "Rupandehi" },
  "चितवन": { np: "चितवन", en: "Chitwan" },
  "कैलाली": { np: "कैलाली", en: "Kailali" },
  "मोरङ": { np: "मोरङ", en: "Morang" },
  "झापा": { np: "झापा", en: "Jhapa" },
  "सुर्खेत": { np: "सुर्खेत", en: "Surkhet" }
};

