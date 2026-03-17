// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from '../useAuth';

vi.mock('../../services/geminiService', () => ({
    checkApiKeySelection: vi.fn(),
    promptForKeySelection: vi.fn()
}));

import { checkApiKeySelection } from '../../services/geminiService';

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should initialize with authorized=false', async () => {
        (checkApiKeySelection as any).mockResolvedValue(false);
        const { result } = renderHook(() => useAuth());

        expect(result.current.keyAuthorized).toBe(false);
    });

    it('should load api key from localStorage', async () => {
        localStorage.setItem('gemini_api_key_local', 'test-key');
        (checkApiKeySelection as any).mockResolvedValue(true);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.keyAuthorized).toBe(true);
    });

    it('should handle saving local key', () => {
        const { result } = renderHook(() => useAuth());

        act(() => {
            result.current.handleSaveLocalKey('AIza-test-key');
        });

        expect(localStorage.getItem('gemini_api_key_local')).toBe('AIza-test-key');
        expect(result.current.keyAuthorized).toBe(true);
    });
});
