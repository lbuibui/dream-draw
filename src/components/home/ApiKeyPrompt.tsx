import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';

interface ApiKeyPromptProps {
  t: {
    keyGuideTitle: string;
    keyGuideDesc: string;
    connectBtn: string;
  };
  onConnect: () => void;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ t, onConnect }) => (
  <div className="w-full max-w-xl mb-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-sm animate-in slide-in-from-bottom-2">
    <div className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
      <Zap className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1">{t.keyGuideTitle}</h4>
      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-3">
        {t.keyGuideDesc}
      </p>
      <button
        onClick={onConnect}
        className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      >
        {t.connectBtn} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  </div>
);
