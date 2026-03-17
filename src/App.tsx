import React from 'react';
import { Testimonial } from './components/ui/Testimonial';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ActionBar } from './components/viewer/ActionBar';
import { ImageGrid } from './components/viewer/ImageGrid';
import { CompletionBanner } from './components/ui/CompletionBanner';
import { Toast } from './components/ui/Toast';
import { ComparisonModal } from './components/modals/ComparisonModal';
import { ZoomModal } from './components/modals/ZoomModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { ArchiveModal } from './components/modals/ArchiveModal';
import { LegalModal } from './components/modals/LegalModal';
import { AmbientBackground } from './components/ui/AmbientBackground';
import { Disclaimer } from './components/ui/Disclaimer';
import { HeroSection } from './components/home/HeroSection';
import { ApiKeyPrompt } from './components/home/ApiKeyPrompt';
import { UploadZone } from './components/home/UploadZone';
import { ComparisonShowcase } from './components/home/ComparisonShowcase';
import { useApp } from './hooks/useApp';

const App: React.FC = () => {
  const {
    pages,
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
  } = useApp();

  const hasPages = pages.length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 flex flex-col font-body transition-colors duration-0 overflow-x-hidden relative">
      <AmbientBackground />

      {/* Background decorations - 无模糊效果 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="hidden dark:block absolute top-[-15%] left-[10%] w-[50%] h-[500px] bg-indigo-900/10 rounded-full"></div>
        <div className="hidden dark:block absolute bottom-[-10%] right-[5%] w-[45%] h-[500px] bg-purple-900/10 rounded-full"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60 dark:to-black/60"></div>
      </div>

      <Header
        t={t}
        lang={lang}
        theme={theme}
        keyAuthorized={keyAuthorized}
        toggleTheme={toggleTheme}
        toggleLanguage={toggleLanguage}
        handleSelectKey={() => setIsKeyModalOpen(true)}
        openKeyModal={() => setIsKeyModalOpen(true)}
        onReset={onReset}
        onOpenArchive={() => setIsArchiveModalOpen(true)}
      />

      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-12 w-full flex flex-col gap-8">
        {/* Landing Page */}
        {!hasPages && (
          <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in zoom-in duration-500">
            <HeroSection lang={lang} />
            
            {!keyAuthorized && (
              <ApiKeyPrompt t={t} onConnect={() => setIsKeyModalOpen(true)} />
            )}
            
            <UploadZone
              t={t}
              isExtracting={isExtracting}
              keyAuthorized={keyAuthorized}
              onFileChange={onFileChange}
            />
            
            <ComparisonShowcase lang={lang} onImageClick={setZoomedImage} />
            
            <div className="mt-8 mb-12">
              <Testimonial lang={lang} />
            </div>
          </div>
        )}

        {/* Editor Page */}
        {hasPages && (
          <>
            <ActionBar
              t={t}
              lang={lang}
              pages={pages}
              completedCount={completedCount}
              progress={progress}
              isAllComplete={isAllComplete}
              resolution={resolution}
              setResolution={setResolution}
              resolutionLocked={resolutionLocked}
              keyAuthorized={keyAuthorized}
              isProcessing={isProcessing}
              isStopping={isStopping}
              isStopped={isStopped}
              startProcessing={startProcessing}
              stopProcessing={stopProcessing}
              handleExportPdf={doExportPdf}
              isExportingPdf={isExportingPdf}
              handleExportPptx={doExportPptx}
              isExportingPptx={isExportingPptx}
              handleDownloadZip={doDownloadZip}
              uploadMode={uploadMode}
            />

            <ImageGrid
              pages={pages}
              isProcessing={isProcessing}
              completedCount={completedCount}
              t={t}
              lang={lang}
              selectAll={selectAll}
              deselectAll={deselectAll}
              toggleSelection={toggleSelection}
              setViewingIndex={setViewingIndex}
              handleDownloadSingleImage={handleDownloadSingleImage}
              currentProcessingIndex={currentProcessingIndex}
              resolution={resolution}
              onRetryPage={retryPage}
            />
          </>
        )}
      </main>

      {hasPages && <Disclaimer t={t} />}

      <Footer t={t} onOpenLegal={(tab) => {
        setLegalInitialTab(tab);
        setIsLegalModalOpen(true);
      }} />

      {/* Completion Banner */}
      <CompletionBanner
        show={showCompletionBanner}
        isStopped={isStopped}
        t={t}
        lang={lang}
        completedCount={completedCount}
        successCount={successCount}
        failCount={failCount}
        handleExportPdf={doExportPdf}
        isExportingPdf={isExportingPdf}
        handleExportPptx={doExportPptx}
        isExportingPptx={isExportingPptx}
        handleDownloadZip={doDownloadZip}
        uploadMode={uploadMode}
        onUploadClick={handleUploadNewClick}
        showUploadWarning={showUploadWarning}
        onClose={() => setShowCompletionBanner(false)}
      />

      {/* Toasts */}
      <Toast show={showStoppingToast} message={lang === 'en' ? 'Stopping after this page...' : '本页完成后停止...'} />
      <Toast show={showErrorToast} message={errorToastMessage} />

      {/* Modals */}
      <ComparisonModal
        viewingIndex={viewingIndex}
        pages={pages}
        onClose={() => setViewingIndex(null)}
        onNavigate={setViewingIndex}
        t={t}
        lang={lang}
      />

      <ZoomModal zoomedImage={zoomedImage} onClose={() => setZoomedImage(null)} />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        lang={lang}
      />

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSave={(key) => {
          handleSaveLocalKey(key);
          setIsKeyModalOpen(false);
        }}
        lang={lang}
      />

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        lang={lang}
        initialTab={legalInitialTab}
      />
    </div>
  );
};

export default App;
