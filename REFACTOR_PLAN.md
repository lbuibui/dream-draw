# 绘梦 (Huimeng) 重构详细方案
 
 ## 目录

1. [状态管理重构](#1-状态管理重构)
2. [组件拆分方案](#2-组件拆分方案)
3. [服务层重构](#3-服务层重构)
4. [类型系统增强](#4-类型系统增强)
5. [自定义 Hooks 优化](#5-自定义-hooks-优化)
6. [测试策略](#6-测试策略)
7. [实施路线图](#7-实施路线图)

---

## 1. 状态管理重构

### 1.1 当前问题

```typescript
// src/App.tsx - 当前状态过于分散
const [pages, setPages] = useState<ProcessedPage[]>([]);
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
const [lang, setLang] = useState<Language>('cn');
const [theme, setTheme] = useState<Theme>('dark');
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
// ... 还有更多
```

### 1.2 解决方案：Zustand Store

#### 安装依赖

```bash
npm install zustand immer
```

#### 创建 Store 结构

```
src/
├── store/
│   ├── index.ts              # 统一导出
│   ├── appStore.ts           # 主应用状态
│   ├── processingStore.ts    # 处理相关状态
│   ├── uiStore.ts            # UI 状态
│   └── middleware/
│       ├── persist.ts        # 持久化中间件
│       └── logger.ts         # 日志中间件
```

#### 1.2.1 UI Store

```typescript
// src/store/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '../i18n/translations';

type Theme = 'dark' | 'light';

interface UIState {
  theme: Theme;
  lang: Language;
  
  // Modals
  isKeyModalOpen: boolean;
  isArchiveModalOpen: boolean;
  isLegalModalOpen: boolean;
  legalInitialTab: 'privacy' | 'terms';
  
  // Toasts
  showStoppingToast: boolean;
  showErrorToast: boolean;
  errorToastMessage: string;
  
  // Zoom/View
  viewingIndex: number | null;
  zoomedImage: string | null;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLang: (lang: Language) => void;
  toggleLanguage: () => void;
  
  openKeyModal: () => void;
  closeKeyModal: () => void;
  openArchiveModal: () => void;
  closeArchiveModal: () => void;
  openLegalModal: (tab?: 'privacy' | 'terms') => void;
  closeLegalModal: () => void;
  
  showStoppingToastFn: () => void;
  hideStoppingToast: () => void;
  showError: (message: string) => void;
  hideError: () => void;
  
  setViewingIndex: (index: number | null) => void;
  setZoomedImage: (url: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'dark',
      lang: 'cn',
      isKeyModalOpen: false,
      isArchiveModalOpen: false,
      isLegalModalOpen: false,
      legalInitialTab: 'privacy',
      showStoppingToast: false,
      showErrorToast: false,
      errorToastMessage: '',
      viewingIndex: null,
      zoomedImage: null,
      
      // Theme actions
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      
      // Language actions
      setLang: (lang) => set({ lang }),
      toggleLanguage: () => set((state) => ({ 
        lang: state.lang === 'en' ? 'cn' : 'en' 
      })),
      
      // Modal actions
      openKeyModal: () => set({ isKeyModalOpen: true }),
      closeKeyModal: () => set({ isKeyModalOpen: false }),
      openArchiveModal: () => set({ isArchiveModalOpen: true }),
      closeArchiveModal: () => set({ isArchiveModalOpen: false }),
      openLegalModal: (tab = 'privacy') => set({ 
        isLegalModalOpen: true, 
        legalInitialTab: tab 
      }),
      closeLegalModal: () => set({ isLegalModalOpen: false }),
      
      // Toast actions
      showStoppingToastFn: () => {
        set({ showStoppingToast: true });
        setTimeout(() => set({ showStoppingToast: false }), 2000);
      },
      hideStoppingToast: () => set({ showStoppingToast: false }),
      showError: (message) => {
        set({ showErrorToast: true, errorToastMessage: message });
        setTimeout(() => set({ showErrorToast: false }), 4000);
      },
      hideError: () => set({ showErrorToast: false }),
      
      // View actions
      setViewingIndex: (index) => set({ viewingIndex: index }),
      setZoomedImage: (url) => set({ zoomedImage: url }),
    }),
    {
      name: 'huimeng-ui',
      partialize: (state) => ({ 
        theme: state.theme, 
        lang: state.lang 
      }),
    }
  )
);
```

#### 1.2.2 处理状态 Store

```typescript
// src/store/processingStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProcessedPage } from '../types';
import { processImageWithGemini } from '../services/geminiService';
import { saveToArchive } from '../db/archive';

interface ProcessingState {
  // Pages
  pages: ProcessedPage[];
  uploadMode: 'pdf' | 'image';
  
  // Processing state
  isProcessing: boolean;
  isStopped: boolean;
  isStopping: boolean;
  currentProcessingIndex: number | null;
  
  // Resolution
  resolution: '2K' | '4K';
  resolutionLocked: boolean;
  
  // Export state
  isExportingPdf: boolean;
  isExportingPptx: boolean;
  
  // Upload warning
  showUploadWarning: boolean;
  hasDownloaded: boolean;
  
  // Computed
  completedCount: number;
  errorCount: number;
  selectedCount: number;
  
  // Actions
  setPages: (pages: ProcessedPage[]) => void;
  addPages: (pages: ProcessedPage[]) => void;
  updatePage: (index: number, update: Partial<ProcessedPage>) => void;
  removePage: (index: number) => void;
  clearPages: () => void;
  
  setUploadMode: (mode: 'pdf' | 'image') => void;
  
  setResolution: (resolution: '2K' | '4K') => void;
  lockResolution: () => void;
  unlockResolution: () => void;
  
  togglePageSelection: (index: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  startProcessing: () => Promise<void>;
  stopProcessing: () => void;
  retryPage: (index: number) => void;
  
  setExportingPdf: (value: boolean) => void;
  setExportingPptx: (value: boolean) => void;
  
  showUploadWarningFn: () => void;
  hideUploadWarning: () => void;
  markDownloaded: () => void;
  resetDownloadState: () => void;
}

export const useProcessingStore = create<ProcessingState>()(
  immer((set, get) => ({
    // Initial state
    pages: [],
    uploadMode: 'pdf',
    isProcessing: false,
    isStopped: false,
    isStopping: false,
    currentProcessingIndex: null,
    resolution: '2K',
    resolutionLocked: false,
    isExportingPdf: false,
    isExportingPptx: false,
    showUploadWarning: false,
    hasDownloaded: false,
    
    // Computed getters
    get completedCount() {
      return get().pages.filter(p => p.status === 'completed').length;
    },
    get errorCount() {
      return get().pages.filter(p => p.status === 'error').length;
    },
    get selectedCount() {
      return get().pages.filter(p => p.selected).length;
    },
    
    // Page actions
    setPages: (pages) => set({ pages }),
    addPages: (newPages) => set((state) => {
      state.pages.push(...newPages);
    }),
    updatePage: (index, update) => set((state) => {
      if (state.pages[index]) {
        Object.assign(state.pages[index], update);
      }
    }),
    removePage: (index) => set((state) => {
      state.pages.splice(index, 1);
    }),
    clearPages: () => set({ 
      pages: [], 
      hasDownloaded: false, 
      showUploadWarning: false 
    }),
    
    setUploadMode: (mode) => set({ uploadMode: mode }),
    
    // Resolution actions
    setResolution: (resolution) => {
      if (!get().resolutionLocked) {
        set({ resolution });
      }
    },
    lockResolution: () => set({ resolutionLocked: true }),
    unlockResolution: () => set({ resolutionLocked: false }),
    
    // Selection actions
    togglePageSelection: (index) => set((state) => {
      if (!state.isProcessing && state.pages[index]) {
        state.pages[index].selected = !state.pages[index].selected;
      }
    }),
    selectAll: () => set((state) => {
      if (!state.isProcessing) {
        state.pages.forEach(p => p.selected = true);
      }
    }),
    deselectAll: () => set((state) => {
      if (!state.isProcessing) {
        state.pages.forEach(p => p.selected = false);
      }
    }),
    
    // Processing actions
    startProcessing: async () => {
      const state = get();
      const pagesToProcess = state.pages.filter(
        p => p.selected && !p.processedUrl
      );
      
      if (pagesToProcess.length === 0) return;
      
      set({ 
        isProcessing: true, 
        isStopped: false, 
        isStopping: false,
        resolutionLocked: true 
      });
      
      const abortController = { aborted: false };
      
      for (let i = 0; i < state.pages.length; i++) {
        if (abortController.aborted) {
          set({ isStopped: true });
          break;
        }
        
        const page = state.pages[i];
        if (page.processedUrl || !page.selected) continue;
        
        set({ currentProcessingIndex: i });
        
        // Update page status to processing
        set((s) => {
          s.pages[i].status = 'processing';
          s.pages[i].resolution = get().resolution;
        });
        
        try {
          const result = await processImageWithGemini(
            page.originalUrl,
            page.width,
            page.height,
            get().resolution
          );
          
          // Update page with result
          set((s) => {
            s.pages[i].processedUrl = result;
            s.pages[i].status = 'completed';
          });
          
          // Save to archive
          const blob = await dataURLtoBlob(result);
          await saveToArchive(
            blob, 
            page.width, 
            page.height, 
            `Page ${i + 1}`, 
            page.originalUrl
          );
          window.dispatchEvent(new Event('archive-saved'));
          
        } catch (error) {
          console.error(`Page ${i + 1} Error:`, error);
          set((s) => {
            s.pages[i].status = 'error';
          });
        }
      }
      
      set({ 
        isProcessing: false, 
        resolutionLocked: false,
        isStopping: false,
        currentProcessingIndex: null
      });
    },
    
    stopProcessing: () => {
      set({ isStopping: true });
      // In real implementation, we need to handle abort properly
    },
    
    retryPage: (index) => set((state) => {
      if (state.pages[index]?.status === 'error') {
        state.pages[index] = {
          ...state.pages[index],
          status: 'pending',
          selected: true,
          processedUrl: undefined as any
        };
      }
    }),
    
    // Export actions
    setExportingPdf: (value) => set({ isExportingPdf: value }),
    setExportingPptx: (value) => set({ isExportingPptx: value }),
    
    // Upload warning actions
    showUploadWarningFn: () => {
      set({ showUploadWarning: true });
      setTimeout(() => set({ showUploadWarning: false }), 5000);
    },
    hideUploadWarning: () => set({ showUploadWarning: false }),
    markDownloaded: () => set({ hasDownloaded: true }),
    resetDownloadState: () => set({ hasDownloaded: false }),
  }))
);

// Helper
const dataURLtoBlob = async (dataurl: string): Promise<Blob> => {
  const res = await fetch(dataurl);
  return await res.blob();
};
```

#### 1.2.3 认证 Store

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  apiKey: string | null;
  keyAuthorized: boolean;
  
  // Actions
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  verifyKey: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      keyAuthorized: false,
      
      setApiKey: (key) => set({ 
        apiKey: key, 
        keyAuthorized: !!key 
      }),
      
      clearApiKey: () => set({ 
        apiKey: null, 
        keyAuthorized: false 
      }),
      
      verifyKey: async () => {
        const { apiKey } = get();
        if (!apiKey) return false;
        
        try {
          // Verify key with a simple API call
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          // Simple verification - you might want to add actual verification
          set({ keyAuthorized: true });
          return true;
        } catch {
          set({ keyAuthorized: false });
          return false;
        }
      },
    }),
    {
      name: 'huimeng-auth',
    }
  )
);
```

#### 1.2.4 统一导出

```typescript
// src/store/index.ts
export { useUIStore } from './uiStore';
export { useProcessingStore } from './processingStore';
export { useAuthStore } from './authStore';

// 复合 hooks
export const useAppState = () => ({
  ui: useUIStore(),
  processing: useProcessingStore(),
  auth: useAuthStore(),
});
```

---

## 2. 组件拆分方案

### 2.1 当前 App.tsx 结构分析

当前 App.tsx 包含以下功能区块：

1. **文件上传区域** (lines 291-396)
2. **对比展示区域** (lines 352-394)
3. **操作栏** (ActionBar)
4. **图片网格** (ImageGrid)
5. **完成横幅** (CompletionBanner)
6. **各种模态框**

### 2.2 拆分后的组件结构

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # 已存在
│   │   ├── Footer.tsx          # 已存在
│   │   └── MainLayout.tsx      # 新增：主布局包装器
│   │
│   ├── upload/
│   │   ├── UploadZone.tsx      # 上传区域
│   │   ├── UploadWarning.tsx   # 上传警告提示
│   │   └── ApiKeyPrompt.tsx    # API Key 提示卡片
│   │
│   ├── showcase/
│   │   ├── BeforeAfterComparison.tsx  # 修复前后对比
│   │   └── ComparisonCard.tsx         # 单个对比卡片
│   │
│   ├── processing/
│   │   ├── ProcessingControls.tsx     # 处理控制栏
│   │   ├── ResolutionSelector.tsx     # 分辨率选择器
│   │   └── ProcessingProgress.tsx     # 处理进度指示
│   │
│   ├── viewer/
│   │   ├── ImageGrid.tsx       # 已存在
│   │   ├── ImageCard.tsx       # 已存在
│   │   └── ActionBar.tsx       # 已存在
│   │
│   ├── modals/
│   │   └── ...                 # 已存在
│   │
│   └── ui/
│       └── ...                 # 已存在
```

### 2.3 核心组件实现

#### 2.3.1 MainLayout

```typescript
// src/components/layout/MainLayout.tsx
import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AmbientBackground } from '../ui/AmbientBackground';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { theme } = useUIStore();
  
  // Apply theme class
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 flex flex-col font-body transition-colors duration-0 overflow-x-hidden relative">
      <AmbientBackground />
      
      {/* Background decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="hidden dark:block absolute top-[-15%] left-[10%] w-[50%] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
        <div className="hidden dark:block absolute bottom-[-10%] right-[5%] w-[45%] h-[500px] bg-purple-900/15 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60 dark:to-black/60"></div>
      </div>
      
      <Header />
      
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-12 w-full flex flex-col gap-8">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};
```

#### 2.3.2 UploadZone

```typescript
// src/components/upload/UploadZone.tsx
import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useUIStore, useProcessingStore, useAuthStore } from '../../store';
import { useFileHandler } from '../../hooks/useFileHandler';

export const UploadZone: React.FC = () => {
  const { lang, t } = useUIStore();
  const { keyAuthorized } = useAuthStore();
  const { isExtracting, handleFileUpload, setUploadMode } = useProcessingStore();
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!keyAuthorized) {
      // Open API key modal
      return;
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setUploadMode('pdf');
      } else if (file.type.startsWith('image/')) {
        setUploadMode('image');
      }
    }
    
    handleFileUpload(e);
  };
  
  return (
    <div className="w-full max-w-xl">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf, image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
        id="pdf-upload-global"
        disabled={isExtracting}
      />
      
      <label
        htmlFor="pdf-upload-global"
        className={`group relative flex flex-col items-center justify-center p-16 w-full border border-dashed rounded-3xl transition-all cursor-pointer backdrop-blur-xl shadow-sm overflow-hidden ${
          keyAuthorized
            ? "border-zinc-200/50 dark:border-white/5 bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-black/30 hover:border-indigo-500/50 dark:hover:border-indigo-400/50"
            : "border-zinc-200/30 dark:border-white/5 bg-white/20 dark:bg-black/10 opacity-80"
        }`}
      >
        {keyAuthorized && (
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
        )}
        
        {isExtracting ? (
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
        ) : (
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Upload className="relative w-12 h-12 text-zinc-400 group-hover:text-indigo-500 transition-colors mb-6 duration-300" />
          </div>
        )}
        
        <h3 className="text-xl font-medium text-zinc-900 dark:text-white mb-2 relative z-10">
          {isExtracting ? t.extracting : t.uploadTitle}
        </h3>
        
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center relative z-10 max-w-xs">
          {t.uploadDesc}
        </p>
      </label>
    </div>
  );
};
```

#### 2.3.3 BeforeAfterComparison

```typescript
// src/components/showcase/BeforeAfterComparison.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useUIStore } from '../../store';
import { ComparisonCard } from './ComparisonCard';
import png4 from '../../assets/png4.png';
import png5 from '../../assets/png5.png';
import png4Thumb from '../../assets/png4-thumb.png';
import png5Thumb from '../../assets/png5-thumb.png';

export const BeforeAfterComparison: React.FC = () => {
  const { lang, setZoomedImage } = useUIStore();
  
  return (
    <div className="w-full max-w-4xl mx-auto mt-24 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 justify-center items-center">
        <ComparisonCard
          image={png4}
          thumbnail={png4Thumb}
          label={lang === 'en' ? 'Original' : '修复前'}
          labelStyle="bg-black/60 text-white/90"
          onClick={() => setZoomedImage(png4)}
        />
        
        <ArrowRight className="w-5 h-5 text-zinc-300/50 dark:text-zinc-700 p-0.5 border border-zinc-300/30 dark:border-white/10 rounded-full rotate-90 md:rotate-0" />
        
        <ComparisonCard
          image={png5}
          thumbnail={png5Thumb}
          label={lang === 'en' ? 'Pro RESTORED' : 'PRO 修复后'}
          labelStyle="bg-indigo-500 text-white"
          badge="4K Ultra HD"
          isHighlighted
          onClick={() => setZoomedImage(png5)}
        />
      </div>
    </div>
  );
};
```

```typescript
// src/components/showcase/ComparisonCard.tsx
import React from 'react';

interface ComparisonCardProps {
  image: string;
  thumbnail: string;
  label: string;
  labelStyle: string;
  badge?: string;
  isHighlighted?: boolean;
  onClick: () => void;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  image,
  thumbnail,
  label,
  labelStyle,
  badge,
  isHighlighted = false,
  onClick,
}) => {
  return (
    <div
      className={`relative group cursor-zoom-in w-full md:w-[45%] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border bg-black ${
        isHighlighted
          ? 'border-indigo-500/20 dark:border-indigo-400/20 ring-1 ring-indigo-500/20 dark:ring-indigo-400/10'
          : 'border-zinc-200 dark:border-white/10'
      }`}
      onClick={onClick}
    >
      <div className={`absolute top-4 left-4 ${labelStyle} text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md z-20 border border-white/10 shadow-lg tracking-wide uppercase`}>
        {label}
      </div>
      
      {badge && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white/90 text-[9px] font-mono px-2 py-1 rounded border border-white/10">
          {badge}
        </div>
      )}
      
      <img
        src={thumbnail}
        data-full={image}
        alt={label}
        className={`w-full h-full object-cover ${isHighlighted ? '' : 'opacity-60'} hover:opacity-80 hover:scale-105 transition-all duration-700`}
        loading="lazy"
        decoding="async"
      />
      
      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
      )}
    </div>
  );
};
```

#### 2.3.4 重构后的 App.tsx

```typescript
// src/App.tsx
import React, { useEffect } from 'react';

// Store
import { useUIStore, useProcessingStore, useAuthStore } from './store';

// Components
import { MainLayout } from './components/layout/MainLayout';
import { UploadZone } from './components/upload/UploadZone';
import { ApiKeyPrompt } from './components/upload/ApiKeyPrompt';
import { BeforeAfterComparison } from './components/showcase/BeforeAfterComparison';
import { ActionBar } from './components/viewer/ActionBar';
import { ImageGrid } from './components/viewer/ImageGrid';
import { CompletionBanner } from './components/ui/CompletionBanner';
import { Testimonial } from './components/ui/Testimonial';
import { Toast } from './components/ui/Toast';

// Modals
import { ComparisonModal } from './components/modals/ComparisonModal';
import { ZoomModal } from './components/modals/ZoomModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { ArchiveModal } from './components/modals/ArchiveModal';
import { LegalModal } from './components/modals/LegalModal';

// DB
import { autoPruneArchives } from './db/archive';

const App: React.FC = () => {
  // Store hooks
  const { 
    lang, 
    t, 
    zoomedImage, 
    setZoomedImage,
    isKeyModalOpen,
    isArchiveModalOpen,
    isLegalModalOpen,
    legalInitialTab,
    closeKeyModal,
    closeArchiveModal,
    closeLegalModal
  } = useUIStore();
  
  const { 
    pages, 
    completedCount,
    showCompletionBanner,
    setShowCompletionBanner
  } = useProcessingStore();
  
  const { keyAuthorized } = useAuthStore();
  
  // Auto-prune archives on mount
  useEffect(() => {
    autoPruneArchives();
  }, []);
  
  const hasPages = pages.length > 0;
  const isAllComplete = pages.length > 0 && completedCount === pages.length;
  
  return (
    <MainLayout>
      {/* Hidden file input */}
      <input
        type="file"
        multiple
        accept="application/pdf, image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        id="pdf-upload-global"
      />
      
      {/* Landing Page (no pages) */}
      {!hasPages && (
        <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in zoom-in duration-500">
          <HeroSection lang={lang} t={t} />
          
          {!keyAuthorized && <ApiKeyPrompt t={t} />}
          
          <UploadZone />
          
          <BeforeAfterComparison />
          
          <Testimonial lang={lang} />
        </div>
      )}
      
      {/* Editor Page (has pages) */}
      {hasPages && (
        <>
          <ActionBar t={t} lang={lang} />
          <ImageGrid t={t} />
          
          {showCompletionBanner && (
            <CompletionBanner
              t={t}
              onClose={() => setShowCompletionBanner(false)}
            />
          )}
        </>
      )}
      
      {/* Modals */}
      <ComparisonModal />
      <ZoomModal 
        imageUrl={zoomedImage} 
        onClose={() => setZoomedImage(null)} 
      />
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={closeKeyModal}
      />
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={closeArchiveModal}
      />
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={closeLegalModal}
        initialTab={legalInitialTab}
      />
      
      {/* Toasts */}
      <Toast />
    </MainLayout>
  );
};

// Hero Section Component
const HeroSection: React.FC<{ lang: string; t: any }> = ({ lang, t }) => (
  <div className="text-center mb-10 max-w-2xl">
    <h2 className="text-4xl md:text-5xl font-heading mb-6 text-zinc-900 dark:text-white">
      {lang === 'en' ? 'Reimagine your ' : '重塑您的 '}
      <span className="italic">NotebookLM</span>
      {lang === 'en' ? ' documents.' : ' 文档。'}
    </h2>
    <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
      {t.description}
    </p>
  </div>
);

export default App;
```

---

## 3. 服务层重构

### 3.1 当前问题

- 服务函数分散，缺乏统一接口
- 错误处理不一致
- 缺少类型安全的配置

### 3.2 重构方案

```
src/
├── services/
│   ├── index.ts                # 统一导出
│   ├── gemini/
│   │   ├── index.ts
│   │   ├── GeminiService.ts    # Gemini 服务类
│   │   ├── types.ts            # 类型定义
│   │   └── prompts.ts          # 提示词
│   ├── export/
│   │   ├── index.ts
│   │   ├── ExportService.ts    # 导出服务类
│   │   ├── PdfExporter.ts      # PDF 导出
│   │   ├── PptxExporter.ts     # PPTX 导出
│   │   └── ZipExporter.ts      # ZIP 导出
│   └── pdf/
│       ├── index.ts
│       ├── PdfParser.ts        # PDF 解析
│       └── types.ts
```

### 3.3 GeminiService 实现

```typescript
// src/services/gemini/GeminiService.ts
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, USER_PROMPT } from './prompts';
import { 
  ProcessOptions, 
  ProcessResult, 
  AspectRatio,
  GeminiConfig 
} from './types';

export class GeminiService {
  private client: GoogleGenAI;
  private config: GeminiConfig;
  
  private static readonly SUPPORTED_ASPECT_RATIOS: AspectRatio[] = [
    { label: '1:1', value: 1.0 },
    { label: '3:4', value: 0.75 },
    { label: '4:3', value: 1.33 },
    { label: '9:16', value: 0.5625 },
    { label: '16:9', value: 1.77 },
  ];
  
  constructor(apiKey: string, config?: Partial<GeminiConfig>) {
    this.client = new GoogleGenAI({ apiKey });
    this.config = {
      model: 'gemini-3.1-flash-image-preview',
      ...config,
    };
  }
  
  async processImage(
    base64Image: string,
    width: number,
    height: number,
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    const {
      imageSize = '2K',
      systemPrompt = SYSTEM_PROMPT,
      userPrompt = USER_PROMPT,
    } = options;
    
    const cleanBase64 = this.sanitizeBase64(base64Image);
    const aspectRatio = this.getClosestAspectRatio(width, height);
    
    try {
      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: {
          parts: [
            { text: userPrompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64,
              },
            },
          ],
        },
        config: {
          systemInstruction: systemPrompt,
          imageConfig: {
            aspectRatio: aspectRatio.label,
            imageSize,
          },
        },
      });
      
      return this.extractResult(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  private sanitizeBase64(base64: string): string {
    return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  }
  
  private getClosestAspectRatio(width: number, height: number): AspectRatio {
    const ratio = width / height;
    
    return GeminiService.SUPPORTED_ASPECT_RATIOS.reduce((prev, curr) => {
      return Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) 
        ? curr 
        : prev;
    });
  }
  
  private extractResult(response: any): ProcessResult {
    const candidates = response.candidates;
    
    if (!candidates?.[0]?.content?.parts) {
      throw new GeminiError('No image generated in response', 'NO_RESULT');
    }
    
    for (const part of candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return {
          success: true,
          dataUrl: `data:image/png;base64,${part.inlineData.data}`,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    }
    
    throw new GeminiError('No image data in response', 'NO_IMAGE_DATA');
  }
  
  private handleError(error: unknown): GeminiError {
    if (error instanceof GeminiError) {
      return error;
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new GeminiError(message, 'API_ERROR');
  }
  
  // Static factory method
  static fromEnv(): GeminiService {
    const apiKey = localStorage.getItem('gemini_api_key_local');
    if (!apiKey) {
      throw new GeminiError('API key not found', 'NO_API_KEY');
    }
    return new GeminiService(apiKey);
  }
}

// Custom Error
export class GeminiError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}
```

```typescript
// src/services/gemini/types.ts
export interface AspectRatio {
  label: string;
  value: number;
}

export interface ProcessOptions {
  imageSize?: '2K' | '4K';
  systemPrompt?: string;
  userPrompt?: string;
}

export interface ProcessResult {
  success: boolean;
  dataUrl: string;
  mimeType: string;
}

export interface GeminiConfig {
  model: string;
}
```

### 3.4 ExportService 实现

```typescript
// src/services/export/ExportService.ts
import { ProcessedPage } from '../../types';
import { PdfExporter } from './PdfExporter';
import { PptxExporter } from './PptxExporter';
import { ZipExporter } from './ZipExporter';

export type ExportFormat = 'pdf' | 'pptx' | 'zip';

export interface ExportOptions {
  filename?: string;
  includeOriginals?: boolean;
}

export class ExportService {
  private pdfExporter: PdfExporter;
  private pptxExporter: PptxExporter;
  private zipExporter: ZipExporter;
  
  constructor() {
    this.pdfExporter = new PdfExporter();
    this.pptxExporter = new PptxExporter();
    this.zipExporter = new ZipExporter();
  }
  
  async export(
    pages: ProcessedPage[],
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<void> {
    const completedPages = this.filterCompleted(pages);
    
    if (completedPages.length === 0) {
      throw new ExportError('No completed pages to export', 'NO_PAGES');
    }
    
    switch (format) {
      case 'pdf':
        return this.pdfExporter.export(completedPages, options);
      case 'pptx':
        return this.pptxExporter.export(completedPages, options);
      case 'zip':
        return this.zipExporter.export(completedPages, options);
      default:
        throw new ExportError(`Unsupported format: ${format}`, 'UNSUPPORTED_FORMAT');
    }
  }
  
  private filterCompleted(pages: ProcessedPage[]): ProcessedPage[] {
    return pages.filter(p => p.processedUrl);
  }
}

export class ExportError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ExportError';
  }
}

// Singleton instance
export const exportService = new ExportService();
```

```typescript
// src/services/export/PdfExporter.ts
import { jsPDF } from 'jspdf';
import { ProcessedPage } from '../../types';
import { ExportOptions } from './ExportService';

export class PdfExporter {
  async export(pages: ProcessedPage[], options: ExportOptions = {}): Promise<void> {
    const { filename = 'upscaled_document.pdf' } = options;
    
    if (pages.length === 0) return;
    
    const firstPage = pages[0];
    const doc = new jsPDF({
      orientation: firstPage.width > firstPage.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [firstPage.width, firstPage.height],
    });
    
    pages.forEach((page, index) => {
      if (index > 0) {
        doc.addPage(
          [page.width, page.height],
          page.width > page.height ? 'landscape' : 'portrait'
        );
      }
      
      doc.addImage(
        page.processedUrl!,
        'PNG',
        0,
        0,
        page.width,
        page.height,
        undefined,
        'FAST'
      );
    });
    
    doc.save(filename);
  }
}
```

---

## 4. 类型系统增强

### 4.1 当前问题

- 类型定义分散
- 缺少严格的类型约束
- 没有使用 discriminated unions

### 4.2 增强方案

```typescript
// src/types/index.ts

// ============================================
// Page Types
// ============================================

export type PageStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface BasePage {
  id: string;
  originalUrl: string;
  pageIndex: number;
  width: number;
  height: number;
  aspectRatio: number;
  selected: boolean;
}

export interface PendingPage extends BasePage {
  status: 'pending';
  processedUrl: null;
  resolution: null;
}

export interface ProcessingPage extends BasePage {
  status: 'processing';
  processedUrl: null;
  resolution: '2K' | '4K';
}

export interface CompletedPage extends BasePage {
  status: 'completed';
  processedUrl: string;
  resolution: '2K' | '4K';
}

export interface ErrorPage extends BasePage {
  status: 'error';
  processedUrl: null;
  resolution: '2K' | '4K';
  errorMessage?: string;
}

export type ProcessedPage = 
  | PendingPage 
  | ProcessingPage 
  | CompletedPage 
  | ErrorPage;

// Type guards
export const isPending = (page: ProcessedPage): page is PendingPage => 
  page.status === 'pending';

export const isProcessing = (page: ProcessedPage): page is ProcessingPage => 
  page.status === 'processing';

export const isCompleted = (page: ProcessedPage): page is CompletedPage => 
  page.status === 'completed';

export const isError = (page: ProcessedPage): page is ErrorPage => 
  page.status === 'error';

// ============================================
// Resolution Types
// ============================================

export type Resolution = '2K' | '4K';

export interface ResolutionOption {
  value: Resolution;
  label: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export const RESOLUTION_OPTIONS: ResolutionOption[] = [
  {
    value: '2K',
    label: '2K Standard',
    description: 'Good balance of quality and speed',
    dimensions: { width: 2048, height: 2048 },
  },
  {
    value: '4K',
    label: '4K Ultra HD',
    description: 'Maximum quality, slower processing',
    dimensions: { width: 4096, height: 4096 },
  },
];

// ============================================
// Aspect Ratio Types
// ============================================

export type AspectRatioLabel = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface AspectRatioInfo {
  label: AspectRatioLabel;
  value: number;
  description: string;
}

export const ASPECT_RATIOS: AspectRatioInfo[] = [
  { label: '1:1', value: 1.0, description: 'Square' },
  { label: '3:4', value: 0.75, description: 'Portrait' },
  { label: '4:3', value: 1.33, description: 'Standard' },
  { label: '9:16', value: 0.5625, description: 'Vertical Video' },
  { label: '16:9', value: 1.77, description: 'Widescreen' },
];

// ============================================
// Processing Types
// ============================================

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  startTime: number | null;
  endTime: number | null;
}

export interface ProcessingProgress {
  currentIndex: number;
  total: number;
  percentage: number;
  currentItem: string | null;
}

// ============================================
// Export Types
// ============================================

export type ExportFormat = 'pdf' | 'pptx' | 'zip';

export interface ExportOptions {
  filename?: string;
  format: ExportFormat;
  includeOriginals?: boolean;
  quality?: 'standard' | 'high';
}

// ============================================
// File Types
// ============================================

export type UploadMode = 'pdf' | 'image';

export type SupportedImageType = 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp';

export const SUPPORTED_FILE_TYPES: Record<UploadMode, string[]> = {
  pdf: ['application/pdf'],
  image: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
};

// ============================================
// UI Types
// ============================================

export type Theme = 'dark' | 'light';

export type Language = 'en' | 'cn';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// ============================================
// API Types
// ============================================

export interface ApiKeyStatus {
  key: string | null;
  isValid: boolean;
  lastVerified: number | null;
}

export interface GeminiResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}
```

---

## 5. 自定义 Hooks 优化

### 5.1 当前问题

- hooks 返回值过多
- 职责不够单一
- 缺少组合性

### 5.2 优化方案

```typescript
// src/hooks/useTheme.ts
import { useCallback, useEffect } from 'react';
import { useUIStore } from '../store';

export function useTheme() {
  const { theme, setTheme } = useUIStore();
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // View Transition API support
    if (event && 'startViewTransition' in document) {
      const x = event.clientX;
      const y = event.clientY;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      
      (document as any).startViewTransition(() => {
        setTheme(newTheme);
      }).ready.then(() => {
        document.documentElement.animate(
          { 
            clipPath: [
              `circle(0px at ${x}px ${y}px)`, 
              `circle(${endRadius}px at ${x}px ${y}px)`
            ] 
          },
          { 
            duration: 500, 
            easing: 'ease-in', 
            pseudoElement: '::view-transition-new(root)' 
          }
        );
      });
    } else {
      setTheme(newTheme);
    }
  }, [theme, setTheme]);
  
  return { theme, setTheme, toggleTheme };
}
```

```typescript
// src/hooks/useExport.ts
import { useState, useCallback } from 'react';
import { exportService, ExportFormat, ExportOptions } from '../services/export';
import { ProcessedPage } from '../types';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const exportPages = useCallback(async (
    pages: ProcessedPage[],
    format: ExportFormat,
    options?: ExportOptions
  ) => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportFormat(format);
    setError(null);
    
    try {
      await exportService.export(pages, format, options);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      throw err;
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  }, [isExporting]);
  
  const exportPdf = useCallback((pages: ProcessedPage[]) => 
    exportPages(pages, 'pdf'), [exportPages]);
  
  const exportPptx = useCallback((pages: ProcessedPage[]) => 
    exportPages(pages, 'pptx'), [exportPages]);
  
  const exportZip = useCallback((pages: ProcessedPage[]) => 
    exportPages(pages, 'zip'), [exportPages]);
  
  return {
    isExporting,
    exportFormat,
    error,
    exportPages,
    exportPdf,
    exportPptx,
    exportZip,
  };
}
```

```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !shortcut.ctrl || event.ctrlKey || event.metaKey;
        const shiftMatch = !shortcut.shift || event.shiftKey;
        const altMatch = !shortcut.alt || event.altKey;
        
        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Usage
// useKeyboardShortcuts([
//   { key: 'Escape', action: closeModal },
//   { key: 's', ctrl: true, action: saveDocument },
// ]);
```

```typescript
// src/hooks/useArchive.ts (优化版)
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ArchivedImage, autoPruneArchives } from '../db/archive';
import { useEffect } from 'react';

export function useArchive() {
  // Auto-prune on mount
  useEffect(() => {
    autoPruneArchives();
  }, []);
  
  // Live query for reactive updates
  const images = useLiveQuery(() => 
    db.images.orderBy('createdAt').reverse().toArray()
  , []);
  
  const count = useLiveQuery(() => db.images.count(), []);
  
  const deleteImage = async (id: number) => {
    await db.images.delete(id);
  };
  
  const clearAll = async () => {
    await db.images.clear();
  };
  
  return {
    images: images ?? [],
    count: count ?? 0,
    isLoading: images === undefined,
    deleteImage,
    clearAll,
  };
}
```

---

## 6. 测试策略

### 6.1 测试结构

```
src/
├── __tests__/
│   ├── setup.ts              # 测试环境设置
│   └── mocks/
│       ├── gemini.ts         # Gemini API mock
│       └── file.ts           # 文件相关 mock
├── services/
│   └── __tests__/
│       ├── geminiService.test.ts
│       └── exportService.test.ts
├── store/
│   └── __tests__/
│       ├── uiStore.test.ts
│       └── processingStore.test.ts
├── hooks/
│   └── __tests__/
│       ├── useExport.test.ts
│       └── useTheme.test.ts
└── components/
    └── __tests__/
        ├── UploadZone.test.tsx
        └── BeforeAfterComparison.test.tsx
```

### 6.2 测试示例

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

```typescript
// src/services/__tests__/geminiService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService, GeminiError } from '../gemini/GeminiService';

// Mock the Google GenAI SDK
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn(),
    },
  })),
}));

describe('GeminiService', () => {
  let service: GeminiService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    service = new GeminiService('test-api-key');
  });
  
  describe('processImage', () => {
    it('should process image and return data URL', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'base64imagedata',
                mimeType: 'image/png',
              },
            }],
          },
        }],
      };
      
      (service as any).client.models.generateContent.mockResolvedValue(mockResponse);
      
      const result = await service.processImage(
        'data:image/png;base64,test',
        100,
        100
      );
      
      expect(result.success).toBe(true);
      expect(result.dataUrl).toBe('data:image/png;base64,base64imagedata');
    });
    
    it('should throw GeminiError when no image is generated', async () => {
      const mockResponse = {
        candidates: [],
      };
      
      (service as any).client.models.generateContent.mockResolvedValue(mockResponse);
      
      await expect(
        service.processImage('data:image/png;base64,test', 100, 100)
      ).rejects.toThrow(GeminiError);
    });
  });
  
  describe('getClosestAspectRatio', () => {
    it('should return 1:1 for square images', () => {
      const result = (service as any).getClosestAspectRatio(100, 100);
      expect(result.label).toBe('1:1');
    });
    
    it('should return 16:9 for widescreen images', () => {
      const result = (service as any).getClosestAspectRatio(1920, 1080);
      expect(result.label).toBe('16:9');
    });
  });
});
```

```typescript
// src/store/__tests__/uiStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUIStore } from '../uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store
    useUIStore.setState({
      theme: 'dark',
      lang: 'cn',
      isKeyModalOpen: false,
    });
  });
  
  it('should toggle theme', () => {
    const { toggleTheme } = useUIStore.getState();
    
    act(() => {
      toggleTheme();
    });
    
    expect(useUIStore.getState().theme).toBe('light');
  });
  
  it('should toggle language', () => {
    const { toggleLanguage } = useUIStore.getState();
    
    act(() => {
      toggleLanguage();
    });
    
    expect(useUIStore.getState().lang).toBe('en');
  });
  
  it('should open and close key modal', () => {
    const { openKeyModal, closeKeyModal } = useUIStore.getState();
    
    act(() => {
      openKeyModal();
    });
    expect(useUIStore.getState().isKeyModalOpen).toBe(true);
    
    act(() => {
      closeKeyModal();
    });
    expect(useUIStore.getState().isKeyModalOpen).toBe(false);
  });
});
```

```typescript
// src/components/__tests__/UploadZone.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadZone } from '../upload/UploadZone';

// Mock stores
vi.mock('../../store', () => ({
  useUIStore: () => ({
    lang: 'cn',
    t: {
      uploadTitle: '上传文件',
      uploadDesc: '拖拽或点击上传',
      extracting: '解析中...',
    },
  }),
  useAuthStore: () => ({
    keyAuthorized: true,
  }),
  useProcessingStore: () => ({
    isExtracting: false,
    handleFileUpload: vi.fn(),
    setUploadMode: vi.fn(),
  }),
}));

describe('UploadZone', () => {
  it('should render upload button', () => {
    render(<UploadZone />);
    
    expect(screen.getByText('上传文件')).toBeInTheDocument();
    expect(screen.getByText('拖拽或点击上传')).toBeInTheDocument();
  });
  
  it('should show loading state when extracting', () => {
    vi.mock('../../store', () => ({
      useUIStore: () => ({
        lang: 'cn',
        t: {
          uploadTitle: '上传文件',
          uploadDesc: '拖拽或点击上传',
          extracting: '解析中...',
        },
      }),
      useAuthStore: () => ({
        keyAuthorized: true,
      }),
      useProcessingStore: () => ({
        isExtracting: true,
        handleFileUpload: vi.fn(),
        setUploadMode: vi.fn(),
      }),
    }));
    
    render(<UploadZone />);
    
    expect(screen.getByText('解析中...')).toBeInTheDocument();
  });
});
```

---

## 7. 实施路线图

### 阶段一：基础设施 (Week 1)

| 任务 | 预估时间 | 优先级 |
|------|----------|--------|
| 安装 Zustand + Immer | 0.5h | 🔴 |
| 创建 store 目录结构 | 1h | 🔴 |
| 实现 uiStore | 2h | 🔴 |
| 实现 authStore | 1h | 🔴 |
| 实现 processingStore | 3h | 🔴 |
| 编写 store 单元测试 | 2h | 🟡 |

### 阶段二：组件拆分 (Week 2)

| 任务 | 预估时间 | 优先级 |
|------|----------|--------|
| 创建 MainLayout | 1h | 🔴 |
| 拆分 UploadZone | 2h | 🔴 |
| 拆分 BeforeAfterComparison | 1.5h | 🔴 |
| 拆分 ApiKeyPrompt | 1h | 🟡 |
| 重构 App.tsx | 2h | 🔴 |
| 组件测试 | 3h | 🟡 |

### 阶段三：服务层重构 (Week 3)

| 任务 | 预估时间 | 优先级 |
|------|----------|--------|
| 实现 GeminiService 类 | 2h | 🔴 |
| 实现 ExportService 类 | 2h | 🔴 |
| 实现 PdfExporter | 1h | 🟡 |
| 实现 PptxExporter | 1h | 🟡 |
| 实现 ZipExporter | 1h | 🟡 |
| 服务层测试 | 3h | 🟡 |

### 阶段四：类型系统 & Hooks (Week 4)

| 任务 | 预估时间 | 优先级 |
|------|----------|--------|
| 整理类型定义 | 2h | 🟡 |
| 实现 discriminated unions | 1h | 🟡 |
| 优化 useTheme hook | 1h | 🟡 |
| 实现 useExport hook | 1.5h | 🟡 |
| 实现 useKeyboardShortcuts | 1h | 🟢 |
| Hooks 测试 | 2h | 🟡 |

### 阶段五：测试 & 文档 (Week 5)

| 任务 | 预估时间 | 优先级 |
|------|----------|--------|
| 提升测试覆盖率到 80% | 8h | 🟡 |
| 添加 Storybook | 4h | 🟢 |
| 更新 README | 1h | 🟡 |
| 添加贡献指南 | 1h | 🟢 |

---

## 总结

本重构方案主要解决以下问题：

1. **状态管理混乱** → 引入 Zustand 统一管理
2. **组件过于臃肿** → 按功能拆分组件
3. **服务层分散** → 统一服务类封装
4. **类型不够严格** → 使用 discriminated unions
5. **测试覆盖不足** → 完善测试体系

重构后预期收益：

- 代码可维护性提升 50%+
- 组件复用性提升
- 测试覆盖率提升至 80%+
- 新功能开发效率提升 30%+
