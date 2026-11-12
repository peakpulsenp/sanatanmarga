import { CourseQuestion } from "@/src/types/assessment";

export const SAMPLE_QUESTIONS: CourseQuestion[] = [
  {
    id: "q-gita-1",
    courseId: "gita-intro",
    lessonId: "lesson-1",
    lessonTitle: "पाठ १: प्रवेश, पृष्ठभूमी र मङ्गलाचरण",
    type: "mcq",
    question: "श्रीमद्भगवद्गीता कुन पौराणिक ग्रन्थ वा महाकाव्यको एक भाग हो?",
    options: [
      { id: "opt-a", text: "रामायण" },
      { id: "opt-b", text: "महाभारत (भीष्म पर्व)" },
      { id: "opt-c", text: "श्रीस्वस्थानी व्रतकथा" },
      { id: "opt-d", text: "अग्नि पुराण" }
    ],
    correctAnswer: "opt-b",
    explanation: "भगवद्गीता महाभारतको भीष्म पर्वअन्तर्गत अध्याय २५ देखि ४२ सम्मको १८ अध्यायको भाग हो।",
    difficulty: "easy",
    source: "manual",
    status: "approved",
    createdBy: "सनातन अकाडेमी सम्पादक मण्डल",
    createdAt: new Date().toISOString()
  },
  {
    id: "q-gita-2",
    courseId: "gita-intro",
    lessonId: "lesson-2",
    lessonTitle: "पाठ २: अर्जुनविषादयोग र जीवनको द्वन्द्व",
    type: "mcq",
    question: "भगवद्गीतामा कूल कति अध्याय र श्लोकहरू रहेका छन्?",
    options: [
      { id: "opt-a", text: "१२ अध्याय र ५०० श्लोक" },
      { id: "opt-b", text: "१८ अध्याय र ७०० श्लोक" },
      { id: "opt-c", text: "२४ अध्याय र १००० श्लोक" },
      { id: "opt-d", text: "१० अध्याय र ४०० श्लोक" }
    ],
    correctAnswer: "opt-b",
    explanation: "भगवद्गीतामा १८ वटा अध्यायहरू र जम्मा ७०० वटा संस्कृत श्लोकहरू रहेका छन्।",
    difficulty: "easy",
    source: "manual",
    status: "approved",
    createdBy: "सनातन अकाडेमी सम्पादक मण्डल",
    createdAt: new Date().toISOString()
  },
  {
    id: "q-gita-3",
    courseId: "gita-intro",
    lessonId: "lesson-3",
    lessonTitle: "पाठ ३: साङ्ख्ययोग: आत्माको अमरता",
    type: "mcq",
    question: "'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन' श्लोक गीताको कुन अध्यायमा आउँछ?",
    options: [
      { id: "opt-a", text: "अध्याय १ (अर्जुनविषादयोग)" },
      { id: "opt-b", text: "अध्याय २ (साङ्ख्ययोग - श्लोक ४७)" },
      { id: "opt-c", text: "अध्याय ९ (राजविद्याराजगुह्ययोग)" },
      { id: "opt-d", text: "अध्याय १८ (मोक्षसंन्यासयोग)" }
    ],
    correctAnswer: "opt-b",
    explanation: "यो प्रसिद्ध श्लोक अध्याय २ को ४७ औं श्लोक हो, जसले कर्मयोगको मूल सिद्धान्त बुझाउँछ।",
    difficulty: "medium",
    source: "manual",
    status: "approved",
    createdBy: "सनातन अकाडेमी सम्पादक मण्डल",
    createdAt: new Date().toISOString()
  },
  {
    id: "q-gita-4",
    courseId: "gita-intro",
    lessonId: "lesson-4",
    lessonTitle: "पाठ ४: कर्मयोग: फलासक्तिरहित कर्तव्य",
    type: "true_false",
    question: "भगवद्गीता अनुसार आत्मालाई हतियारले काट्न, आगोले बाल्न वा पानीले भिजाउन सकिन्छ?",
    options: [
      { id: "opt-true", text: "सकिन्छ (सत्य)" },
      { id: "opt-false", text: "सकिँदैन (असत्य - आत्मा नित्य र अमर छ)" }
    ],
    correctAnswer: "opt-false",
    explanation: "'नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः' - आत्मा अविनाशी र सनातन छ।",
    difficulty: "easy",
    source: "manual",
    status: "approved",
    createdBy: "सनातन अकाडेमी सम्पादक मण्डल",
    createdAt: new Date().toISOString()
  },
  {
    id: "q-gita-5",
    courseId: "gita-intro",
    lessonId: "lesson-5",
    lessonTitle: "पाठ ५: ज्ञानकर्मसंन्यासयोग",
    type: "mcq",
    question: "गीतामा 'स्थितप्रज्ञ' भन्नाले कस्तो व्यक्तिलाई बुझाइन्छ?",
    options: [
      { id: "opt-a", text: "संसार त्यागेर जङ्गल जाने मानिस" },
      { id: "opt-b", text: "सुख र दुःखमा समान बुद्धि भएको स्थिर मनको ज्ञानी" },
      { id: "opt-c", text: "धेरै धन आर्जन गर्ने व्यक्ति" },
      { id: "opt-d", text: "केवल मन्त्र जप मात्र गर्ने साधक" }
    ],
    correctAnswer: "opt-b",
    explanation: "स्थितप्रज्ञ भन्नाले सुख र दुःख, लाभ र हानिमाचलित नहुने समबुद्धि साधक बुझिन्छ।",
    difficulty: "medium",
    source: "manual",
    status: "approved",
    createdBy: "सनातन अकाडेमी सम्पादक मण्डल",
    createdAt: new Date().toISOString()
  }
];
