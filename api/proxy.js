import { GoogleGenAI } from "@google/genai";

export const config = {
    maxDuration: 60,
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { image, prompt, imageSize, aspectRatio } = req.body;

        // Validate API Key (Server-side)
        const SERVER_KEY = process.env.GEMINI_API_KEY;
        if (!SERVER_KEY) {
            return res.status(500).json({ error: "Server Error: GEMINI_API_KEY Config Missing" });
        }

        // Call Google Gemini
        const ai = new GoogleGenAI({ apiKey: SERVER_KEY });
        const cleanBase64 = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: cleanBase64,
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio || "1:1",
                    imageSize: imageSize || "2K",
                }
            }
        });

        // Construct Response Payload
        const candidates = response.candidates;
        if (!candidates || !candidates[0] || !candidates[0].content) {
            throw new Error("No candidates returned");
        }

        let payload = { candidates };

        // Check Payload Size (Vercel Limit: 4.5MB)
        const payloadSize = Buffer.byteLength(JSON.stringify(payload));
        const MAX_VERCEL_SIZE = 4.4 * 1024 * 1024; // 4.4MB safety margin

        if (payloadSize > MAX_VERCEL_SIZE) {
            console.log(`Payload too large (${(payloadSize / 1024 / 1024).toFixed(2)}MB). Switching to R2 Fallback...`);

            const S3 = await import('@aws-sdk/client-s3');
            const Presigner = await import('@aws-sdk/s3-request-presigner');

            const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
            const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
            const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
            const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

            if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
                console.error("R2 Config Missing. Returning 413.");
                return res.status(413).json({
                    error: "Image too large (Vercel Limit) and R2 not configured. Please use '2K'."
                });
            }

            const s3 = new S3.S3Client({
                region: 'auto',
                endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId: R2_ACCESS_KEY_ID,
                    secretAccessKey: R2_SECRET_ACCESS_KEY,
                },
            });

            // Extract Base64 from Candidate
            const part = candidates[0].content.parts[0];
            const base64Data = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `gen_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

            try {
                // Upload
                await s3.send(new S3.PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: fileName,
                    Body: buffer,
                    ContentType: mimeType,
                }));

                // Generate Signed URL
                const command = new S3.GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileName });
                // @ts-ignore
                const url = await Presigner.getSignedUrl(s3, command, { expiresIn: 3600 });

                // Create Lightweight Payload
                const lightCandidates = JSON.parse(JSON.stringify(candidates));
                // Remove inlineData, replace with custom imageUrl field
                lightCandidates[0].content.parts[0] = {
                    imageUrl: url,
                    mimeType: mimeType
                };

                payload = { candidates: lightCandidates };
            } catch (r2Error) {
                console.error("R2 Upload Failed:", r2Error);
                return res.status(500).json({
                    error: "Image generated but failed to deliver (Upload Error)."
                });
            }
        }

        return res.status(200).json(payload);

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
