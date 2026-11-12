import React from 'react';
import { ShieldCheck, BookOpen, Award, FileText, ArrowLeft, Users, CheckCircle2 } from 'lucide-react';
import SeoHead from '../seo/SeoHead';

interface InstitutionalPageProps {
  type: 'about' | 'editorial' | 'corrections' | 'sources' | 'authors' | 'privacy' | 'terms';
  onNavigateHome: () => void;
}

export const InstitutionalPage: React.FC<InstitutionalPageProps> = ({ type, onNavigateHome }) => {
  const getPageInfo = () => {
    switch (type) {
      case 'about':
        return {
          title: 'About SanatanMarga — Mission & Heritage',
          titleNepali: 'हाम्रो बारेमा (About SanatanMarga)',
          description: 'SanatanMarga is a premier digital news, scholarship, and manuscript preservation platform dedicated to Sanatan Dharma and Himalayan civilization.',
          icon: BookOpen,
          content: (
            <div className="space-y-4 text-stone-700 dark:text-stone-300">
              <p>
                <strong>सनातनमार्ग (SanatanMarga)</strong> एक स्वतन्त्र, प्रामाणिक र डिजिटल पत्रकारिता तथा सनातन ज्ञान पीठ हो।
                हाम्रो मुख्य उद्देश्य सनातन धर्म, वेद, उपनिषद्, भगवद्गीता, नेपालको हिमाली शैव दर्शन, पशुपतिनाथ परम्परा र संस्कृतिलाई आधुनिक डिजिटल माध्यमबाट विश्वभर पुर्‍याउनु हो।
              </p>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mt-4">मुख्य उद्देश्यहरू (Our Mission):</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>प्रामाणिक र निष्पक्ष समाचार, विचार र अनुसन्धान प्रकाशन गर्नु।</li>
                <li>सरस्वती ग्रन्थ गुप्त सूचना प्रणाली (SGIS) मार्फत दुर्लभ पाण्डुलिपि संरक्षण गर्नु।</li>
                <li>नेपालको धार्मिक, सांस्कृतिक र पर्यटकीय सम्पदाको विश्वव्यापी प्रवर्द्धन गर्नु।</li>
              </ul>
            </div>
          )
        };
      case 'editorial':
        return {
          title: 'Editorial Policy & Standards — SanatanMarga',
          titleNepali: 'सम्पादकीय नीति र मापदण्ड (Editorial Policy)',
          description: 'SanatanMarga adheres to strict editorial independence, fact-checking, scriptural verification, and ethical journalism.',
          icon: ShieldCheck,
          content: (
            <div className="space-y-4 text-stone-700 dark:text-stone-300">
              <p>
                सनातनमार्गमा प्रकाशित हुने प्रत्येक समाचार, लेख र विश्लेषणात्मक सामग्री कडा सम्पादकीय परीक्षण, तथ्य-जाँच (Fact-Checking) र शास्त्रीय प्रमाणबाट गुज्रन्छन्।
              </p>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mt-4">सिद्धान्तहरू:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>तथ्य र शास्त्रमा आधारित:</strong> कुनै पनि मनगढन्ते वा भ्रामक सूचना प्रकाशित गरिने छैन।</li>
                <li><strong>लेखकको पारदर्शी परिचय:</strong> प्रत्येक लेखमा सम्पादक तथा अनुसन्धाताको स्पष्ट परिचय रहनेछ।</li>
                <li><strong>कृत्रिम बुद्धिमत्ता (AI) प्रयोग नीति:</strong> एआई प्रविधि केवल सहायक र भाषा सुधारका लागि प्रयोग गरिन्छ; अन्तिम सम्पादन मानव सम्पादकद्वारा नै हुन्छ।</li>
              </ul>
            </div>
          )
        };
      case 'corrections':
        return {
          title: 'Corrections & Accountability Policy — SanatanMarga',
          titleNepali: 'सच्च्याउने नीति (Corrections Policy)',
          description: 'Our policy on corrections, updates, and transparent error handling in news and articles.',
          icon: CheckCircle2,
          content: (
            <div className="space-y-4 text-stone-700 dark:text-stone-300">
              <p>
                यदि हाम्रा कुनै सामग्रीमा तथ्यगत त्रुटि देखा परेमा, सनातनमार्गले तुरुन्त र पूर्ण पारदर्शिताका साथ त्यसलाई सच्च्याउने प्रतिबद्धता व्यक्त गर्दछ।
              </p>
              <p>
                सच्च्याइएका सामग्रीमा <em>"अद्यावधिक (Updated)"</em> वा <em>"त्रुटि सुधार (Correction)"</em> नोट प्रस्ट रूपमा थपिनेछ।
              </p>
            </div>
          )
        };
      case 'authors':
        return {
          title: 'Authors & Research Scholars — SanatanMarga',
          titleNepali: 'लेखक तथा अनुसन्धाताहरू (Editorial Board & Authors)',
          description: 'Meet the editors, scholars, and journalists behind SanatanMarga scholarship and reporting.',
          icon: Users,
          content: (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-stone-800 rounded-lg border border-amber-200 dark:border-stone-700 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-lg">
                  SR
                </div>
                <div>
                  <h4 className="font-bold text-base text-amber-950 dark:text-amber-100">Sagar Rana (सागर राणा)</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">प्रधान सम्पादक तथा सनातन ज्ञान अनुसन्धाता (Editor-in-Chief)</p>
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
                    संस्कृत पाण्डुलिपि संरक्षण, वैदिक दर्शन र हिमाली धार्मिक इतिहासका विषयमा विगत १० वर्षदेखि अनुसन्धानरत।
                  </p>
                </div>
              </div>
            </div>
          )
        };
      default:
        return {
          title: 'Terms & Institutional Policy — SanatanMarga',
          titleNepali: 'नीति तथा सर्तहरू (Policies & Terms)',
          description: 'Institutional policies, privacy notice, and usage terms for SanatanMarga.',
          icon: FileText,
          content: (
            <p className="text-stone-700 dark:text-stone-300">
              सनातनमार्गका सबै सामग्री सर्वाधिकार सुरक्षित छन्। अनधिकृत प्रतिलिपि वा व्यावसायिक प्रयोग निषेध गरिएको छ।
            </p>
          )
        };
    }
  };

  const info = getPageInfo();
  const IconComp = info.icon;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-16">
      <SeoHead
        type="static_page"
        title={info.title}
        description={info.description}
        canonicalPath={`/${type}`}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> मुख्य पृष्ठमा फर्कनुहोस्
        </button>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
            <IconComp className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            <div>
              <h1 className="text-2xl font-serif font-bold text-amber-950 dark:text-amber-100">
                {info.titleNepali}
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Official SanatanMarga Institutional Page
              </p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
            {info.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalPage;
