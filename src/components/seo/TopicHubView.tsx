import React from 'react';
import { SANATAN_TOPIC_HUBS } from '../../data/topicHubsData';
import { BookOpen, Award, CheckCircle, ChevronRight, Share2, ArrowLeft } from 'lucide-react';
import SeoHead from './SeoHead';

interface TopicHubViewProps {
  slug: string;
  onNavigateHome: () => void;
  onSelectArticle?: (id: string) => void;
}

export const TopicHubView: React.FC<TopicHubViewProps> = ({ slug, onNavigateHome, onSelectArticle }) => {
  const hub = SANATAN_TOPIC_HUBS[slug] || SANATAN_TOPIC_HUBS['sanatan-dharma'];

  const breadcrumbs = [
    { name: 'गृह (Home)', item: '/' },
    { name: 'ज्ञान हब (Knowledge)', item: '/knowledge' },
    { name: hub.titleNepali, item: `/topic/${hub.slug}` }
  ];

  return (
    <div className="min-h-screen bg-amber-50/30 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-16">
      <SeoHead
        type="topic_hub"
        title={hub.title}
        description={hub.description}
        canonicalPath={`/topic/${hub.slug}`}
        ogImage={hub.featuredImage}
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-amber-100/60 to-amber-50/10 dark:from-stone-900 dark:to-stone-950 border-b border-amber-200/50 dark:border-stone-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> मुख्य पृष्ठमा फर्कनुहोस्
          </button>
          
          <div className="inline-block px-3 py-1 bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 text-xs font-bold rounded-full mb-3">
            {hub.category} · Topic Pillar
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-amber-950 dark:text-amber-100 mb-2">
            {hub.titleNepali}
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
            {hub.descriptionNepali}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Verified Sources:</span>
            {hub.authoritativeSources.map((src, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-white/70 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded">
                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Key Questions & Answers (FAQ) */}
        <section className="bg-white dark:bg-stone-900 rounded-xl border border-amber-200/60 dark:border-stone-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold font-serif text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" /> मुख्य प्रश्न तथा उत्तरहरू (Core QA)
          </h2>
          <div className="space-y-4">
            {hub.keyQuestions.map((q, idx) => (
              <div key={idx} className="p-4 bg-amber-50/40 dark:bg-stone-800/40 rounded-lg border border-amber-100 dark:border-stone-800">
                <h3 className="font-semibold text-base text-stone-900 dark:text-stone-100 mb-1">
                  {q.questionNepali}
                </h3>
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {q.answerNepali}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Scriptural Citation Block */}
        <section className="bg-white dark:bg-stone-900 rounded-xl border border-amber-200/60 dark:border-stone-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold font-serif text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" /> शास्त्र प्रमाण र श्लोक (Scriptural Evidence)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hub.scripturalReferences.map((ref, idx) => (
              <div key={idx} className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                  {ref.text} ({ref.verse})
                </div>
                <blockquote className="text-sm italic font-serif text-stone-800 dark:text-stone-200">
                  "{ref.citation}"
                </blockquote>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TopicHubView;
