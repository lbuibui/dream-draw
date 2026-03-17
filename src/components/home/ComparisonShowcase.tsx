import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Language } from '../../i18n/translations';
import png4 from '../../assets/png4.png';
import png5 from '../../assets/png5.png';
import png4Thumb from '../../assets/png4-thumb.png';
import png5Thumb from '../../assets/png5-thumb.png';

interface ComparisonShowcaseProps {
  lang: Language;
  onImageClick: (image: string) => void;
}

export const ComparisonShowcase: React.FC<ComparisonShowcaseProps> = ({ lang, onImageClick }) => (
  <div className="w-full max-w-4xl mx-auto mt-24 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 justify-center items-center">
      {/* Before */}
      <div
        className="relative group cursor-zoom-in w-full md:w-[45%] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10 bg-black"
        onClick={() => onImageClick(png4)}
      >
        <div className="absolute top-4 left-4 bg-black/60 text-white/90 text-[10px] font-bold px-3 py-1.5 rounded-full z-20 border border-white/10 shadow-lg tracking-wide uppercase">
          {lang === 'en' ? 'Original' : '修复前'}
        </div>
        <img
          src={png4Thumb}
          data-full={png4}
          alt="Original"
          className="w-full h-full object-cover opacity-60 hover:opacity-80 hover:scale-105 transition-all duration-700"
          loading="lazy"
          decoding="async"
        />
      </div>

      <ArrowRight className="w-5 h-5 text-zinc-300/50 dark:text-zinc-700 p-0.5 border border-zinc-300/30 dark:border-white/10 rounded-full rotate-90 md:rotate-0" />

      {/* After */}
      <div
        className="relative group cursor-zoom-in w-full md:w-[45%] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/20 dark:border-indigo-400/20 ring-1 ring-indigo-500/20 dark:ring-indigo-400/10 bg-black"
        onClick={() => onImageClick(png5)}
      >
        <div className="absolute top-4 left-4 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-20 shadow-lg shadow-indigo-500/20 tracking-wide uppercase">
          {lang === 'en' ? 'Pro RESTORED' : 'PRO 修复后'}
        </div>
        <div className="absolute bottom-4 right-4 bg-black/60 text-white/90 text-[9px] font-mono px-2 py-1 rounded border border-white/10">
          4K Ultra HD
        </div>
        <img
          src={png5Thumb}
          data-full={png5}
          alt="Restored"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
      </div>
    </div>
  </div>
);
