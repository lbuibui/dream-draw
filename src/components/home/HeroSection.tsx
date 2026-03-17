import React from 'react';
import { Language } from '../../i18n/translations';

interface HeroSectionProps {
  lang: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang }) => (
  <div className="text-center mb-10 max-w-2xl">
    <h2 className="text-4xl md:text-5xl font-heading mb-6 text-zinc-900 dark:text-white">
      {lang === 'en' ? 'Reimagine your ' : '重塑您的 '}
      <span className="italic">{lang === 'en' ? 'Documents' : '文档'}</span>
      {lang === 'en' ? '.' : '。'}
    </h2>
  </div>
);
