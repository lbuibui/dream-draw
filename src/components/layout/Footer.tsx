import React from 'react';

interface FooterProps {
    t: any;
    onOpenLegal?: (tab: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({ t, onOpenLegal }) => {
    return (
        <footer className="w-full py-8 mt-auto border-t border-zinc-200/30 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
            <div className="max-w-5xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-custom">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-center md:text-left">
                        <span>{t.copyright}</span>
                        <span className="hidden md:inline text-zinc-300 dark:text-zinc-700">|</span>
                        <span>{t.builtBy}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => onOpenLegal?.('privacy')}
                            className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                            {t.privacy}
                        </button>
                        <button
                            onClick={() => onOpenLegal?.('terms')}
                            className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                            {t.terms}
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};
