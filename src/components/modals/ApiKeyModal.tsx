import React, { useState, useEffect } from 'react';
import { Key, X, ExternalLink, Save, Eye, EyeOff, Zap } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    lang: 'en' | 'cn';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, lang }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState('');

    const t = TRANSLATIONS[lang];

    useEffect(() => {
        if (isOpen) {
            const savedKey = localStorage.getItem('gemini_api_key_local');
            if (savedKey) setApiKey(savedKey);
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = apiKey.trim();
        if (!value) return;

        if (value.startsWith('AIza')) {
            localStorage.setItem('gemini_api_key_local', value);
            onSave(value);
            onClose();
        } else {
            setError(t.invalidKey);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">

                <div className="px-6 py-5 border-b border-zinc-100/50 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-heading font-bold text-zinc-900 dark:text-white leading-none">
                                {t.keyModalTitle}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                {t.keyModalDesc}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative group">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={t.keyInputPlaceholder}
                                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                >
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {error && <p className="text-xs text-red-500 font-medium animate-in fade-in flex items-center gap-1"><Zap className="w-3 h-3" /> {error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={!apiKey.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[0px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Save className="w-4 h-4" />
                            <span>{t.save}</span>
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-200 dark:border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-mono-custom tracking-widest">
                                {t.getKey}
                            </span>
                        </div>
                    </div>

                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="group relative p-4 rounded-xl border border-zinc-200 dark:border-white/10 hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all flex items-center gap-4"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t.googleTitle}</span>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {t.googleDesc1}<br />
                                    <span className="text-amber-500">{t.googleDesc2}</span>
                                </p>
                            </div>
                            <ExternalLink className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500" />
                        </div>
                    </a>

                    <p className="text-[10px] text-center text-zinc-400">
                        {t.tip}
                    </p>

                </div>
            </div>
        </div>
    );
};
