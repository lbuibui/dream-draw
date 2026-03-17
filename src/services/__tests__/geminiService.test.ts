// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processImageWithGemini, checkApiKeySelection } from '../geminiService';
import { GoogleGenAI } from "@google/genai";

const mockGenerate = vi.fn();
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: vi.fn().mockImplementation(function () {
            return {
                models: {
                    generateContent: mockGenerate
                }
            };
        })
    };
});

describe('geminiService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        process.env.API_KEY = '';
        process.env.GEMINI_API_KEY = '';
    });

    describe('checkApiKeySelection', () => {
        it('should return true if local storage has key', async () => {
            localStorage.setItem('gemini_api_key_local', 'test');
            expect(await checkApiKeySelection()).toBe(true);
        });

        it('should return false if empty', async () => {
            expect(await checkApiKeySelection()).toBe(false);
        });
    });

    describe('processImageWithGemini', () => {
        it('should use direct API if key is present', async () => {
            localStorage.setItem('gemini_api_key_local', 'AIza-test-key');

            mockGenerate.mockResolvedValueOnce({
                candidates: [{
                    content: { parts: [{ inlineData: { data: 'directBase64' } }] }
                }]
            });

            const result = await processImageWithGemini('data:image/png;base64,start', 100, 100, '2K');

            expect(result).toContain('directBase64');
            expect(mockGenerate).toHaveBeenCalled();
        });

        it('should throw error if no key is present', async () => {
            await expect(processImageWithGemini('data:image/png;base64,start', 100, 100, '2K'))
                .rejects.toThrow('No API Key found');
        });
    });
});
