import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ProcessedPage } from '../../types';
import { ImageCard } from './ImageCard';
import { detectPerformanceLevel } from '../../utils/performance';

interface ImageGridProps {
    pages: ProcessedPage[];
    isProcessing: boolean;
    completedCount: number;
    t: any;
    lang: 'en' | 'cn';
    selectAll: () => void;
    deselectAll: () => void;
    toggleSelection: (index: number) => void;
    setViewingIndex: (index: number) => void;
    handleDownloadSingleImage: (page: ProcessedPage) => void;
    currentProcessingIndex: number | null;
    resolution: string;
    onRetryPage?: (index: number) => void;
}

// 根据性能等级设置不同的渲染策略
const perfLevel = detectPerformanceLevel();
const INITIAL_RENDER_COUNT = perfLevel === 'low' ? 6 : perfLevel === 'medium' ? 9 : 12;
const BATCH_SIZE = perfLevel === 'low' ? 3 : 6;

export const ImageGrid: React.FC<ImageGridProps> = ({
    pages,
    isProcessing,
    completedCount,
    t,
    lang,
    selectAll,
    deselectAll,
    toggleSelection,
    setViewingIndex,
    handleDownloadSingleImage,
    currentProcessingIndex,
    resolution,
    onRetryPage
}) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 当页面数量变化时重置可见数量
    useEffect(() => {
        setVisibleCount(INITIAL_RENDER_COUNT);
    }, [pages.length]);

    // 使用 Intersection Observer 实现懒加载
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < pages.length) {
                    // 分批加载更多
                    setVisibleCount(prev => Math.min(prev + BATCH_SIZE, pages.length));
                }
            },
            { 
                rootMargin: '100px',
                threshold: 0.1 
            }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [visibleCount, pages.length]);

    // 确保正在处理的页面始终可见
    const visiblePages = useMemo(() => {
        const pagesToShow = pages.slice(0, visibleCount);
        
        // 如果当前处理的页面不在可见范围内，将其加入
        if (currentProcessingIndex !== null && currentProcessingIndex >= visibleCount) {
            return pages.slice(0, Math.max(visibleCount, currentProcessingIndex + 1));
        }
        
        return pagesToShow;
    }, [pages, visibleCount, currentProcessingIndex]);

    const selectedCount = useMemo(() => 
        pages.filter(p => p.selected).length,
    [pages]);

    const hasMore = visibleCount < pages.length;

    if (pages.length === 0) return null;

    return (
        <div className="space-y-4" ref={containerRef}>
            {/* Select All / Deselect All */}
            {!isProcessing && completedCount < pages.length && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={selectAll}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition-colors"
                    >
                        {t.selectAll}
                    </button>
                    <button
                        onClick={deselectAll}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600 transition-colors"
                    >
                        {t.deselectAll}
                    </button>
                    <span className="text-xs text-zinc-400">
                        {selectedCount} / {pages.length} {lang === 'en' ? 'selected' : '已选'}
                    </span>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {visiblePages.map((page, idx) => (
                    <ImageCard
                        key={page.pageIndex}
                        index={idx}
                        page={page}
                        currentProcessingIndex={currentProcessingIndex}
                        resolution={resolution}
                        t={t}
                        lang={lang}
                        isProcessing={isProcessing}
                        toggleSelection={toggleSelection}
                        setViewingIndex={setViewingIndex}
                        handleDownloadSingleImage={handleDownloadSingleImage}
                        onRetry={onRetryPage}
                    />
                ))}
            </div>

            {/* 加载更多触发器 */}
            {hasMore && (
                <div 
                    ref={loadMoreRef}
                    className="flex justify-center py-8"
                >
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <div className="w-5 h-5 border-2 border-zinc-300 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span>{lang === 'en' ? 'Loading more...' : '加载更多...'}</span>
                    </div>
                </div>
            )}

            {/* 显示统计信息 */}
            {pages.length > INITIAL_RENDER_COUNT && (
                <div className="text-center text-xs text-zinc-400 pb-4">
                    {lang === 'en' 
                        ? `Showing ${visiblePages.length} of ${pages.length} pages` 
                        : `显示 ${visiblePages.length} / ${pages.length} 页`}
                </div>
            )}
        </div>
    );
};
