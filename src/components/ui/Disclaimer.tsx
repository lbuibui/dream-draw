import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DisclaimerProps {
  t: {
    disclaimerTitle: string;
    disclaimerText: string;
  };
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ t }) => (
  <div className="max-w-3xl mx-auto px-6 mb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
    <div className="relative group overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 dark:from-amber-500/10 dark:to-red-500/10 p-5">
      <div className="absolute inset-0 border-l-4 border-l-amber-500/80 pointer-events-none"></div>
      <div className="flex items-start gap-4">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            {t.disclaimerTitle}
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed text-justify">
            {t.disclaimerText}
          </p>
        </div>
      </div>
    </div>
  </div>
);
