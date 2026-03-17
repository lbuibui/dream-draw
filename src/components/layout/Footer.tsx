import React from 'react';

interface FooterProps {
    t: any;
    onOpenLegal?: (tab: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
    return (
        <footer className="w-full py-10 mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 relative z-50">
            <div className="max-w-5xl mx-auto px-6">
                {/* 免责声明 */}
                <div className="text-center mb-8">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                        免责声明
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                        AI 修复并非 100% 完美，对于原图中极小或极其模糊的文字，可能存在修复失败的情况，请予以理解。
                    </p>
                </div>

                {/* 分隔线 */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 mb-6"></div>

                {/* 底部信息行 */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-center md:text-left">
                        <span>© 2026 dream-draw</span>
                        <span className="hidden md:inline text-zinc-300 dark:text-zinc-600">|</span>
                        <span>由 惊蛰 基于开源项目二次设计与开发。</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => onOpenLegal?.('privacy')}
                            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                            隐私政策
                        </button>
                        <button
                            onClick={() => onOpenLegal?.('terms')}
                            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                            服务条款
                        </button>
                        <a
                            href="https://github.com/lbuibui"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
