import { useState, useEffect, useCallback } from 'react';
import { checkApiKeySelection, promptForKeySelection } from '../services/geminiService';

export function useAuth() {
    const [keyAuthorized, setKeyAuthorized] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('gemini_api_key_local');
    });

    // 初始化 - 检查 API Key 状态
    useEffect(() => {
        const initAuth = async () => {
            const key = localStorage.getItem('gemini_api_key_local');
            setKeyAuthorized(!!key);
        };
        initAuth();
    }, []);

    const handleSaveLocalKey = useCallback(async (key: string) => {
        localStorage.setItem('gemini_api_key_local', key);
        setKeyAuthorized(true);
    }, []);

    const verifyKey = useCallback(async () => {
        const authorized = await checkApiKeySelection();
        setKeyAuthorized(authorized);
        return authorized;
    }, []);

    const handleSelectKey = useCallback(async () => {
        await promptForKeySelection();
        await verifyKey();
    }, [verifyKey]);

    const handleDeleteKey = useCallback(async () => {
        localStorage.removeItem('gemini_api_key_local');
        setKeyAuthorized(false);
    }, []);

    const handleStorageChange = useCallback((e: StorageEvent) => {
        if (e.key === 'gemini_api_key_local') {
            verifyKey();
        }
    }, [verifyKey]);

    useEffect(() => {
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [handleStorageChange]);

    return {
        keyAuthorized,
        handleSaveLocalKey,
        handleSelectKey,
        handleDeleteKey,
        verifyKey
    };
}
