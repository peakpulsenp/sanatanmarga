import React, { useState } from 'react';
import { Volume2, Play, Pause, Bookmark, Sparkles, Shield, Music, Disc, Headphones, CheckCircle } from 'lucide-react';
import { MOCK_VEDIC_AUDIOS, getTodayObject } from '@/src/services/todayEngine';
import type { VedicAudioItem } from '@/src/types/today';

export default function VedicAudioHub() {
  const today = getTodayObject();
  const [selectedCollection, setSelectedCollection] = useState<string>('All');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<VedicAudioItem | null>(MOCK_VEDIC_AUDIOS[0]);
  const [activeTab, setActiveTab] = useState<'bulletin' | 'hub'>('bulletin');

  const collections = ['All', 'Veda', 'Stotra', 'Mantra', 'Upanishad', 'Meditation', 'Festival', 'Morning'];

  const filteredAudios = MOCK_VEDIC_AUDIOS.filter(a => {
    return selectedCollection === 'All' || a.collection === selectedCollection;
  });

  const togglePlay = (audio: VedicAudioItem) => {
    if (currentAudio?.id === audio.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentAudio(audio);
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm my-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs tracking-wider uppercase mb-1">
            <Music className="w-4 h-4" /> ListenOS & Vedic Audio Hub
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            वैदिक अडियो हब र दैनिक श्रव्य बुलेटिन (Vedic Audio Hub)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {today.dailyBulletin.title} र प्राचीन वैदिक मन्त्र, स्तोत्र, उपनिषद्को प्रमाणित सङ्ग्रह।
          </p>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('bulletin')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'bulletin'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            🎙️ आजको ८ मिनेट बुलेटिन (Daily Bulletin)
          </button>
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'hub'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            🕉️ वैदिक अडियो हब (Vedic Hub)
          </button>
        </div>
      </div>

      {activeTab === 'bulletin' ? (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Headphones className="w-10 h-10 animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="text-xs bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                  {today.dailyBulletin.audioDuration}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Deterministic Audio Cache Enabled</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {today.dailyBulletin.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
                {today.dailyBulletin.summary}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  {isPlaying ? 'बुलेटिन रोक्नुहोस् (Pause)' : 'बुलेटिन सुन्नुहोस् (Play Audio Bulletin)'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-amber-200/50 dark:border-amber-900/40">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
              बुलेटिन मुख्य आकर्षणहरू (Bulletin Highlights):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {today.dailyBulletin.bulletinPoints.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-white/80 dark:bg-zinc-800/80 p-3 rounded-xl border border-amber-200/50 dark:border-zinc-700">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Collections Filter */}
          <div className="flex overflow-x-auto gap-2 pb-3 mb-6 scrollbar-none">
            {collections.map(col => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCollection === col
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {col === 'All' ? 'सबै कलेक्सन (All)' : col}
              </button>
            ))}
          </div>

          {/* Audio Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAudios.map(audio => {
              const isCurrent = currentAudio?.id === audio.id;
              return (
                <div
                  key={audio.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase">
                        {audio.collection} • {audio.duration}
                      </span>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base mt-1.5">
                        {audio.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => togglePlay(audio)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isCurrent && isPlaying
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-amber-600 hover:bg-amber-50'
                      }`}
                    >
                      {isCurrent && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-amber-600" />}
                    </button>
                  </div>

                  <p className="text-xs italic text-zinc-600 dark:text-zinc-300 mb-2 font-serif bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    "{audio.transliteration}"
                  </p>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">अर्थ:</span> {audio.meaning}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <span>Provenance: {audio.provenance}</span>
                    <span className="font-bold text-amber-600">{audio.membershipTier} Access</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
