import React, { memo, useMemo } from 'react';
import {
    Check,
    CheckCircle,
    AlertCircle,
    Maximize2,
    Download
} from 'lucide-react';
import { ProcessedPage } from '../../types';
import { shouldEnableAnimations } from '../../utils/performance';

interface ImageCardProps {
    page: ProcessedPage;
    index: number;
    currentProcessingIndex: number | null;
    resolution: string;
    t: any;
    lang: 'en' | 'cn';
    isProcessing: boolean;
    toggleSelection: (index: number) => void;
    setViewingIndex: (index: number) => void;
    handleDownloadSingleImage: (page: ProcessedPage) => void;
    onRetry?: (index: number) => void;
}

// 静态标志，只检测一次
const enableAnimations = shouldEnableAnimations();

export const ImageCard: React.FC<ImageCardProps> = memo(({
    page,
    index,
    currentProcessingIndex,
    resolution,
    t,
    lang,
    isProcessing,
    toggleSelection,
    setViewingIndex,
    handleDownloadSingleImage,
    onRetry
}) => {
    // 使用 useMemo 缓存类名计算
    const cardClasses = useMemo(() => {
        const baseClasses = 'relative group bg-white/40 dark:bg-black/20 border rounded-2xl overflow-hidden';
        const hoverClasses = enableAnimations ? 'transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20' : '';
        
        if (currentProcessingIndex === index) {
            return `${baseClasses} ${hoverClasses} border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/50 scale-[1.01] z-10 opacity-100`;
        }
        if (page.status === 'completed') {
            return `${baseClasses} ${hoverClasses} border-emerald-500/30 dark:border-emerald-500/20 opacity-100`;
        }
        if (!page.selected) {
            return `${baseClasses} border-white/30 dark:border-white/5 opacity-50 grayscale cursor-pointer`;
        }
        return `${baseClasses} ${hoverClasses} border-white/30 dark:border-white/5 opacity-100 cursor-pointer`;
    }, [currentProcessingIndex, index, page.status, page.selected]);

    const handleClick = () => {
        if (!page.processedUrl) {
            toggleSelection(index);
        }
    };

    const handleViewClick = () => {
        if (page.status === 'completed') {
            setViewingIndex(index);
        }
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleDownloadSingleImage(page);
    };

    const handleRetry = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRetry && !isProcessing) {
            onRetry(index);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cardClasses}
        >
            {!page.processedUrl && (
                <div className="absolute top-4 left-4 z-40">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${page.selected
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'bg-transparent border-zinc-300 dark:border-zinc-600 hover:border-zinc-400'
                        }`}>
                        {page.selected && <Check className="w-4 h-4 text-white" />}
                    </div>
                </div>
            )}

            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                {page.status === 'completed' && (
                    <>
                        <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5" /> {t.restored}
                        </span>
                        {page.resolution && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border ${page.resolution === '4K'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                                }`}>
                                {page.resolution}
                            </span>
                        )}
                    </>
                )}
                {page.status === 'error' && (
                    <div className="relative group/error">
                        <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium px-2.5 py-1 rounded-full border border-red-500/20 flex items-center gap-1.5 shadow-sm cursor-help transition-colors hover:bg-red-500/20">
                            <AlertCircle className="w-3.5 h-3.5" /> {t.failed}
                        </span>

                        <div className="absolute top-full right-0 mt-2 w-max max-w-[220px] p-3 bg-zinc-900/95 dark:bg-zinc-800/95 rounded-xl border border-white/10 shadow-xl origin-top-right transition-opacity duration-200 opacity-0 invisible group-hover/error:opacity-100 group-hover/error:visible z-50">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                                    {lang === 'en' ? 'Processing failed. Please retry.' : '处理失败，请重试。'}
                                </p>
                                {onRetry && !isProcessing && (
                                    <button
                                        onClick={handleRetry}
                                        className="mt-1 w-full py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                        {lang === 'en' ? 'Retry' : '重试'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {page.status === 'processing' && (
                <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
                    
                    {/* 简化动画：低性能环境使用静态效果 */}
                    {enableAnimations && (
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                    )}

                    <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-full border border-white/10 shadow-lg">
                            <div className={`w-1.5 h-1.5 bg-indigo-400 rounded-full ${enableAnimations ? 'animate-pulse' : ''}`}></div>
                            <span className="text-white/90 text-[10px] font-medium tracking-widest uppercase font-mono-custom">
                                {t.enhancing}
                            </span>
                            <span className="text-white/50 text-[10px] font-mono-custom pl-1 border-l border-white/10">
                                {page.resolution || resolution}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div
                onClick={handleViewClick}
                className={`aspect-[3/4] relative w-full bg-zinc-100 dark:bg-zinc-950 p-2 ${page.status === 'completed' ? 'cursor-zoom-in' : ''}`}
            >
                {page.processedUrl ? (
                    <div className="w-full h-full relative">
                        <img
                            src={page.processedUrl}
                            alt="Enhanced"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain rounded-lg shadow-inner bg-white dark:bg-zinc-900"
                        />
                        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-lg pointer-events-none ${enableAnimations ? 'opacity-0 group-hover:opacity-100 transition-opacity' : 'opacity-0'}`}>
                            <div className="px-4 py-2 bg-black/80 rounded-full text-xs text-white border border-white/10 shadow-lg flex items-center gap-2 mb-2">
                                <Maximize2 className="w-3 h-3" />
                                {t.clickToView}
                            </div>

                            <button
                                onClick={handleDownload}
                                className="pointer-events-auto p-2 bg-white text-zinc-900 rounded-full shadow-lg hover:scale-110 transition-transform"
                                title="Download Image"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <img
                        src={page.originalUrl}
                        alt="Original"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain rounded-lg opacity-60 grayscale-[20%] mix-blend-multiply dark:mix-blend-normal"
                    />
                )}
            </div>

            <div className="absolute bottom-2 left-2 text-[10px] font-mono-custom text-zinc-400 px-2 py-1 bg-white/50 dark:bg-black/50 rounded">
                {t.page} {page.pageIndex + 1}
            </div>
        </div>
    );
});

ImageCard.displayName = 'ImageCard';
