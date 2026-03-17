import { useState, useRef, useEffect } from 'react';
import { ProcessedPage } from '../types';
import { processImageWithGemini } from '../services/geminiService';
import { saveToArchive } from '../db/archive';

interface UseImageProcessingProps {
    pages: ProcessedPage[];
    setPages: React.Dispatch<React.SetStateAction<ProcessedPage[]>>;
    keyAuthorized: boolean;
    verifyKey: () => Promise<boolean>;
    handleSelectKey: () => Promise<void>;
}

const dataURLtoBlob = async (dataurl: string): Promise<Blob> => {
    const res = await fetch(dataurl);
    return await res.blob();
};

export function useImageProcessing({
    pages,
    setPages,
    keyAuthorized,
    verifyKey,
    handleSelectKey
}: UseImageProcessingProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number | null>(null);
    const [resolution, setResolution] = useState<'2K' | '4K'>('2K');
    const [resolutionLocked, setResolutionLocked] = useState(false);
    const [showCompletionBanner, setShowCompletionBanner] = useState(false);
    const [showStoppingToast, setShowStoppingToast] = useState(false);

    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorToastMessage, setErrorToastMessage] = useState('');

    const abortRef = useRef(false);

    const triggerErrorToast = (msg: string) => {
        setErrorToastMessage(msg);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 4000);
    };

    const startProcessing = async () => {
        if (!keyAuthorized) {
            const success = await verifyKey();
            if (!success) {
                await handleSelectKey();
                return;
            }
        }

        const pagesToProcess = pages.filter(p => p.selected && !p.processedUrl);
        if (pagesToProcess.length === 0) {
            if (pages.some(p => !p.selected)) {
                alert("No pages selected for processing.");
            }
            return;
        }

        setIsProcessing(true);
        setIsStopped(false);
        setIsStopping(false);
        setResolutionLocked(true);
        abortRef.current = false;

        const newPages = [...pages];

        for (let i = 0; i < newPages.length; i++) {
            if (newPages[i].processedUrl || !newPages[i].selected) continue;

            if (abortRef.current) {
                setIsStopped(true);
                break;
            }

            setCurrentProcessingIndex(i);

            newPages[i].status = 'processing';
            newPages[i].resolution = resolution;
            setPages([...newPages]);

            try {
                const result = await processImageWithGemini(
                    newPages[i].originalUrl,
                    newPages[i].width,
                    newPages[i].height,
                    resolution
                );

                newPages[i].processedUrl = result;
                newPages[i].status = 'completed';

                try {
                    const blob = await dataURLtoBlob(result);
                    await saveToArchive(blob, newPages[i].width, newPages[i].height, `Page ${newPages[i].pageIndex + 1}`, newPages[i].originalUrl);
                    window.dispatchEvent(new Event('archive-saved'));
                } catch (archiveErr) {
                    console.error("Failed to archive image:", archiveErr);
                }

            } catch (error) {
                console.error(`Page ${i + 1} Error:`, error);
                newPages[i].status = 'error';

                if (!showErrorToast) {
                    triggerErrorToast('⚠️ Processing failed. Please try again.');
                }
            }

            setPages([...newPages]);
        }

        setIsProcessing(false);
        setResolutionLocked(false);
        setIsStopping(false);
        setCurrentProcessingIndex(null);

        const selectedPages = newPages.filter(p => p.selected);
        const allSelectedDone = selectedPages.length > 0 && selectedPages.every(p => p.status === 'completed' || p.status === 'error');
        const hasSuccessfulPages = selectedPages.some(p => p.status === 'completed');

        if (hasSuccessfulPages && (allSelectedDone || abortRef.current)) {
            setShowCompletionBanner(true);
        }
    };

    const stopProcessing = () => {
        abortRef.current = true;
        setIsStopping(true);
        setShowStoppingToast(true);
        setTimeout(() => setShowStoppingToast(false), 2000);
    };

    const retryPage = (index: number) => {
        setPages(prev => {
            const newPages = [...prev];
            if (newPages[index] && newPages[index].status === 'error') {
                newPages[index] = {
                    ...newPages[index],
                    status: 'pending',
                    selected: true,
                    processedUrl: undefined
                };
            }
            return newPages;
        });
    };

    const successCount = pages.filter(p => p.status === 'completed').length;
    const failCount = pages.filter(p => p.status === 'error').length;

    return {
        isProcessing,
        isStopped,
        isStopping,
        currentProcessingIndex,
        resolution,
        setResolution,
        resolutionLocked,
        setResolutionLocked,
        showCompletionBanner,
        setShowCompletionBanner,
        showStoppingToast,
        showErrorToast,
        errorToastMessage,
        startProcessing,
        stopProcessing,
        retryPage,
        successCount,
        failCount
    };
}
