import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  t: {
    uploadTitle: string;
    uploadDesc: string;
    extracting: string;
  };
  isExtracting: boolean;
  keyAuthorized: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  t,
  isExtracting,
  keyAuthorized,
  onFileChange,
  disabled = false,
}) => (
  <div className="w-full max-w-xl">
    <label
      htmlFor="pdf-upload-global"
      className={`group relative flex flex-col items-center justify-center p-16 w-full border border-dashed rounded-3xl transition-all cursor-pointer bg-white/50 dark:bg-zinc-800/50 shadow-sm overflow-hidden ${
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
    <input
      type="file"
      multiple
      accept="application/pdf, image/png, image/jpeg, image/jpg, image/webp"
      onChange={onFileChange}
      className="hidden"
      id="pdf-upload-global"
      disabled={disabled || isExtracting}
    />
  </div>
);
