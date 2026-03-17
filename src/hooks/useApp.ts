import { useState, useRef, useEffect, useCallback } from 'react';
import { ProcessedPage } from '../types';
import { generatePdf, generatePptx, generateZip } from '../services/pdfService';
import { autoPruneArchives } from '../db/archive';
import { useAuth } from './useAuth';
import { useFileHandler } from './useFileHandler';
import { useImageProcessing } from './useImageProcessing';
import { TRANSLATIONS, Language } from '../i18n/translations';

type Theme = 'dark' | 'light';

export function useApp() {
  // Auth
  const {
    keyAuthorized,
    handleSaveLocalKey,
    handleSelectKey,
    verifyKey,
  } = useAuth();

  // File handling
  const {
    pages,
    setPages,
    isExtracting,
    handleFileUpload,
    handleDownloadZip,
    handleDownloadSingleImage,
  } = useFileHandler();

  // Image processing
  const {
    isProcessing,
    isStopped,
    isStopping,
    currentProcessingIndex,
    resolution,
    setResolution,
    resolutionLocked,
    showCompletionBanner,
    setShowCompletionBanner,
    showStoppingToast,
    showErrorToast,
    errorToastMessage,
    startProcessing,
    stopProcessing,
    retryPage,
    successCount,
    failCount,
  } = useImageProcessing({
    pages,
    setPages,
    keyAuthorized,
    verifyKey,
    handleSelectKey,
  });

  // UI State
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'cn';
    const saved = localStorage.getItem('huimeng_lang');
    return (saved === 'en' || saved === 'cn') ? saved : 'cn';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    // 默认使用浅色模式
    const saved = localStorage.getItem('huimeng_theme');
    const initialTheme = (saved === 'light' || saved === 'dark') ? saved : 'light';
    // 立即应用主题到 DOM
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return initialTheme;
  });
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<'privacy' | 'terms'>('privacy');
  const [uploadMode, setUploadMode] = useState<'pdf' | 'image'>('pdf');
  const [showUploadWarning, setShowUploadWarning] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);

  const t = TRANSLATIONS[lang];

  // Effects
  useEffect(() => {
    autoPruneArchives();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('huimeng_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('huimeng_lang', lang);
    // 更新 body 的语言 class
    document.body.classList.remove('lang-en', 'lang-cn');
    document.body.classList.add(`lang-${lang}`);
  }, [lang]);

  // Theme toggle with View Transition API
  const toggleTheme = useCallback((event: React.MouseEvent) => {
    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      return;
    }
    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: 'ease-in', pseudoElement: '::view-transition-new(root)' }
      );
    });
  }, []);

  const toggleLanguage = useCallback(() => setLang(prev => prev === 'en' ? 'cn' : 'en'), []);

  // Reset
  const onReset = useCallback(() => {
    setPages([]);
    setHasDownloaded(false);
    setShowCompletionBanner(false);
    setShowUploadWarning(false);
  }, [setPages, setShowCompletionBanner]);

  // Export functions
  const doExportPdf = useCallback(async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    await new Promise(r => setTimeout(r, 50));
    try {
      const completedPages = pages.filter(p => p.status === 'completed');
      generatePdf(completedPages);
      setHasDownloaded(true);
    } catch (error) {
      console.error("Export PDF failed", error);
      alert("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, pages]);

  const doExportPptx = useCallback(async () => {
    if (isExportingPptx) return;
    setIsExportingPptx(true);
    await new Promise(r => setTimeout(r, 50));
    try {
      const completedPages = pages.filter(p => p.status === 'completed');
      await generatePptx(completedPages);
      setHasDownloaded(true);
    } catch (error) {
      console.error("Export PPTX failed", error);
      alert("Failed to export PPTX");
    } finally {
      setIsExportingPptx(false);
    }
  }, [isExportingPptx, pages]);

  const doDownloadZip = useCallback(async () => {
    try {
      const completedPages = pages.filter(p => p.status === 'completed');
      await generateZip(completedPages);
      setHasDownloaded(true);
    } catch (error) {
      console.error("ZIP Error", error);
      alert("Failed to generate ZIP");
    }
  }, [pages]);

  // File change handler
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!keyAuthorized) {
      setIsKeyModalOpen(true);
      e.target.value = '';
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') setUploadMode('pdf');
      else if (file.type.startsWith('image/')) setUploadMode('image');
    }
    setShowCompletionBanner(false);
    setHasDownloaded(false);
    handleFileUpload(e);
  }, [keyAuthorized, handleFileUpload]);

  // Upload new click handler
  const handleUploadNewClick = useCallback(() => {
    const completedCount = pages.filter(p => p.status === 'completed').length;
    if (showUploadWarning) {
      setShowUploadWarning(false);
      triggerUpload();
      return;
    }
    if (completedCount > 0 && !hasDownloaded) {
      setShowUploadWarning(true);
      setTimeout(() => setShowUploadWarning(false), 5000);
      return;
    }
    triggerUpload();
  }, [pages, showUploadWarning, hasDownloaded]);

  const triggerUpload = useCallback(() => {
    const input = document.getElementById('pdf-upload-global') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }, []);

  // Selection handlers
  const toggleSelection = useCallback((index: number) => {
    if (isProcessing) return;
    setPages(prev => prev.map((p, i) => i === index ? { ...p, selected: !p.selected } : p));
  }, [isProcessing, setPages]);

  const selectAll = useCallback(() => {
    if (isProcessing) return;
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  }, [isProcessing, setPages]);

  const deselectAll = useCallback(() => {
    if (isProcessing) return;
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  }, [isProcessing, setPages]);

  // Computed values
  const completedCount = pages.filter(p => p.status === 'completed').length;
  const progress = pages.length > 0 ? (completedCount / pages.length) * 100 : 0;
  const isAllComplete = pages.length > 0 && completedCount === pages.length;

  return {
    // State
    pages,
    setPages,
    lang,
    theme,
    t,
    keyAuthorized,
    isExtracting,
    isProcessing,
    isStopped,
    isStopping,
    currentProcessingIndex,
    resolution,
    setResolution,
    resolutionLocked,
    showCompletionBanner,
    setShowCompletionBanner,
    showStoppingToast,
    showErrorToast,
    errorToastMessage,
    viewingIndex,
    setViewingIndex,
    zoomedImage,
    setZoomedImage,
    isKeyModalOpen,
    setIsKeyModalOpen,
    isArchiveModalOpen,
    setIsArchiveModalOpen,
    isLegalModalOpen,
    setIsLegalModalOpen,
    legalInitialTab,
    setLegalInitialTab,
    uploadMode,
    showUploadWarning,
    hasDownloaded,
    isExportingPdf,
    isExportingPptx,
    completedCount,
    progress,
    isAllComplete,
    successCount,
    failCount,

    // Actions
    toggleTheme,
    toggleLanguage,
    onReset,
    handleSaveLocalKey,
    handleSelectKey,
    startProcessing,
    stopProcessing,
    retryPage,
    doExportPdf,
    doExportPptx,
    doDownloadZip,
    handleDownloadZip,
    handleDownloadSingleImage,
    onFileChange,
    handleUploadNewClick,
    toggleSelection,
    selectAll,
    deselectAll,
  };
}
