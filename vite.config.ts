import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
    },
    plugins: [
      react(),
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use('/api/proxy', async (req, res) => {
            if (req.method === 'POST') {
              try {
                // 1. Read Body
                const buffers = [];
                for await (const chunk of req) {
                  buffers.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(buffers).toString());
                const { prompt, image, imageSize, aspectRatio } = data;

                // 2. Call Gemini (Using Env Key)
                const { GoogleGenAI } = await import('@google/genai');
                const apiKey = env.GEMINI_API_KEY || env.API_KEY;

                console.log("------------------------------------------------");
                console.log("Local Proxy Request Received");
                console.log("Image Size:", imageSize || '2K');
                console.log("Aspect Ratio:", aspectRatio || 'auto');
                console.log("Using Server Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "NOT FOUND");
                console.log("------------------------------------------------");

                if (!apiKey) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: "Server API Key not found in .env" }));
                  return;
                }

                const ai = new GoogleGenAI({ apiKey });
                const model = 'gemini-3.1-flash-image-preview';

                // 定义提示词
                const SYSTEM_PROMPT = "你是一个专业的图像修复专家。";

                const response = await ai.models.generateContent({
                  model: model,
                  contents: {
                    parts: [
                      { text: prompt },
                      {
                        inlineData: {
                          mimeType: 'image/png',
                          data: image,
                        },
                      },
                    ],
                  },
                  config: {
                    systemInstruction: SYSTEM_PROMPT,
                    imageConfig: {
                      aspectRatio: aspectRatio || '16:9',
                      imageSize: imageSize || '2K',
                    }
                  },
                });

                // 3. Return result
                const candidates = response.candidates;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ candidates }));

              } catch (e) {
                console.error("Local Proxy Error:", e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.toString() }));
              }
            } else {
              res.statusCode = 405;
              res.end();
            }
          });
        },
      }
    ],
    define: {
      // Security Fix: Do NOT inject GEMINI_API_KEY into client-side code
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      sourcemap: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});
