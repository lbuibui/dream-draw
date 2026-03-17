
export interface ProcessedPage {
  originalUrl: string;
  processedUrl: string | null;
  pageIndex: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  width: number;
  height: number;
  aspectRatio: number;
  resolution?: '2K' | '4K';
  selected: boolean;
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  startTime: number;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    pdfjsLib: any;
  }
}
