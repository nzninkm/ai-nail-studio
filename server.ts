import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for large payload (for base64 uploaded hand photos)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy Gemini client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Helper to normalize polygon points and coordinates to 0.0 - 100.0 percentage scale
function normalizeNailPoint(rawPt: any, bbox?: { ymin: number; xmin: number; ymax: number; xmax: number }): { x: number; y: number } {
  let x = 0;
  let y = 0;

  if (typeof rawPt === "object" && rawPt !== null) {
    if (typeof rawPt.x === "number") x = rawPt.x;
    else if (typeof rawPt.point_x === "number") x = rawPt.point_x;
    else if (Array.isArray(rawPt)) x = rawPt[0] || 0;

    if (typeof rawPt.y === "number") y = rawPt.y;
    else if (typeof rawPt.point_y === "number") y = rawPt.point_y;
    else if (Array.isArray(rawPt)) y = rawPt[1] || 0;
  }

  // If coordinates were provided in 0 - 1000 scale (standard Gemini vision detection)
  if (x > 100) x = x / 10;
  else if (x <= 1.0 && x > 0) x = x * 100;

  if (y > 100) y = y / 10;
  else if (y <= 1.0 && y > 0) y = y * 100;

  // Check if x and y might be inverted relative to boundingBox
  if (bbox && typeof bbox.xmin === "number" && typeof bbox.ymin === "number") {
    const bxMin = bbox.xmin > 100 ? bbox.xmin / 10 : (bbox.xmin <= 1.0 ? bbox.xmin * 100 : bbox.xmin);
    const bxMax = bbox.xmax > 100 ? bbox.xmax / 10 : (bbox.xmax <= 1.0 ? bbox.xmax * 100 : bbox.xmax);
    const byMin = bbox.ymin > 100 ? bbox.ymin / 10 : (bbox.ymin <= 1.0 ? bbox.ymin * 100 : bbox.ymin);
    const byMax = bbox.ymax > 100 ? bbox.ymax / 10 : (bbox.ymax <= 1.0 ? bbox.ymax * 100 : bbox.ymax);

    const inNormalBox = x >= bxMin - 6 && x <= bxMax + 6 && y >= byMin - 6 && y <= byMax + 6;
    const inFlippedBox = y >= bxMin - 6 && y <= bxMax + 6 && x >= byMin - 6 && x <= byMax + 6;

    if (!inNormalBox && inFlippedBox) {
      const temp = x;
      x = y;
      y = temp;
    }
  }

  return {
    x: Math.round(Math.max(0, Math.min(100, x)) * 10) / 10,
    y: Math.round(Math.max(0, Math.min(100, y)) * 10) / 10,
  };
}

function sanitizeNails(nails: any[]): any[] {
  if (!Array.isArray(nails)) return [];

  return nails.map((nail, index) => {
    const rawBox = nail.boundingBox || { ymin: 0, xmin: 0, ymax: 1000, xmax: 1000 };
    const bbox = {
      ymin: rawBox.ymin <= 100 && rawBox.ymin > 1 ? rawBox.ymin * 10 : (rawBox.ymin <= 1.0 ? rawBox.ymin * 1000 : rawBox.ymin || 0),
      xmin: rawBox.xmin <= 100 && rawBox.xmin > 1 ? rawBox.xmin * 10 : (rawBox.xmin <= 1.0 ? rawBox.xmin * 1000 : rawBox.xmin || 0),
      ymax: rawBox.ymax <= 100 && rawBox.ymax > 1 ? rawBox.ymax * 10 : (rawBox.ymax <= 1.0 ? rawBox.ymax * 1000 : rawBox.ymax || 1000),
      xmax: rawBox.xmax <= 100 && rawBox.xmax > 1 ? rawBox.xmax * 10 : (rawBox.xmax <= 1.0 ? rawBox.xmax * 1000 : rawBox.xmax || 1000),
    };

    let poly = nail.polygon;
    if (Array.isArray(poly)) {
      poly = poly.map((pt: any) => normalizeNailPoint(pt, bbox));
    } else {
      // Fallback synthetic polygon from bounding box if missing
      const bx = bbox.xmin / 10;
      const by = bbox.ymin / 10;
      const bw = (bbox.xmax - bbox.xmin) / 10;
      const bh = (bbox.ymax - bbox.ymin) / 10;
      poly = [
        { x: bx + bw * 0.2, y: by + bh * 0.9 },
        { x: bx + bw * 0.5, y: by + bh * 1.0 },
        { x: bx + bw * 0.8, y: by + bh * 0.9 },
        { x: bx + bw * 0.95, y: by + bh * 0.5 },
        { x: bx + bw * 0.85, y: by + bh * 0.1 },
        { x: bx + bw * 0.5, y: by },
        { x: bx + bw * 0.15, y: by + bh * 0.1 },
        { x: bx + bw * 0.05, y: by + bh * 0.5 },
      ];
    }

    return {
      id: nail.id || `nail_${index}`,
      fingerName: nail.fingerName || `Finger ${index + 1}`,
      fingerNameFa: nail.fingerNameFa || `انگشت ${index + 1}`,
      nailShape: nail.nailShape || "squoval",
      tiltAngle: typeof nail.tiltAngle === "number" ? nail.tiltAngle : 0,
      boundingBox: bbox,
      polygon: poly,
    };
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: AI Nail Detection & Anatomical Analysis
app.post("/api/detect-nails", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Strip header prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const ai = getGenAI();

    const prompt = `You are an expert nail technician and computer vision system.
Analyze this hand image to detect all visible fingernails with high anatomical precision.

For EACH visible fingernail (thumb, index, middle, ring, pinky):
1. Identify the finger:
   - id: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
   - fingerName: 'Thumb' | 'Index Finger' | 'Middle Finger' | 'Ring Finger' | 'Pinky'
   - fingerNameFa: 'شست' | 'اشاره' | 'وسط' | 'حلقه' | 'کوچک'
2. Detect the exact polygon contour of the nail plate/bed:
   - Provide an array of 10 to 16 points outlining the perimeter of the nail:
     starting from the cuticle bottom curve (the curved root where the nail emerges from the proximal skin fold), following the lateral sidewall groove, around the free edge tip, and down the opposite sidewall back to cuticle.
   - Points must strictly hug the true nail plate without overflowing onto surrounding skin.
   - Order points sequentially in a smooth closed loop around the nail perimeter.
   - Coordinates x and y must be percentages of image dimensions (0.0 to 100.0).
3. Bounding box in 0-1000 normalized integer scale: ymin, xmin, ymax, xmax.
4. Nail shape: 'almond' | 'oval' | 'square' | 'squoval' | 'coffin' | 'stiletto' | 'round'
5. Tilt angle of the nail longitudinal axis: degrees between -45 and 45.

Also evaluate the hand:
- handType: 'left' | 'right' | 'unknown'
- skinTone: e.g. 'Fair', 'Medium', 'Olive', 'Deep'
- skinToneFa: 'روشن', 'متوسط', 'گندمی / زیتونی', 'سبزه تیره'
- skinUndertone: 'cool' | 'warm' | 'neutral'
- skinUndertoneFa: 'سرد (ته‌رنگ صورتی)', 'گرم (ته‌رنگ طلایی/هلویی)', 'خنثی (متعادل)'
- recommendedShades: 4 recommended complementary polish colors with hex code, English name, and Persian name.
- lightSourceDirection: 'top-left' | 'top-right' | 'top' | 'front'
- existingPolishDetected: boolean (whether the nails currently have any polish, chipping, or color)
- existingPolishDescription: brief description of current polish/nails in Persian.

Return strictly valid JSON matching this specification.`;

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          handType: { type: Type.STRING },
          skinTone: { type: Type.STRING },
          skinToneFa: { type: Type.STRING },
          skinUndertone: { type: Type.STRING },
          skinUndertoneFa: { type: Type.STRING },
          lightSourceDirection: { type: Type.STRING },
          existingPolishDetected: { type: Type.BOOLEAN },
          existingPolishDescription: { type: Type.STRING },
          recommendedShades: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hex: { type: Type.STRING },
                name: { type: Type.STRING },
                nameFa: { type: Type.STRING },
                descriptionFa: { type: Type.STRING },
              },
              required: ["hex", "name", "nameFa"],
            },
          },
          nails: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                fingerName: { type: Type.STRING },
                fingerNameFa: { type: Type.STRING },
                nailShape: { type: Type.STRING },
                tiltAngle: { type: Type.NUMBER },
                boundingBox: {
                  type: Type.OBJECT,
                  properties: {
                    ymin: { type: Type.NUMBER },
                    xmin: { type: Type.NUMBER },
                    ymax: { type: Type.NUMBER },
                    xmax: { type: Type.NUMBER },
                  },
                  required: ["ymin", "xmin", "ymax", "xmax"],
                },
                polygon: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                    },
                    required: ["x", "y"],
                  },
                },
              },
              required: ["id", "fingerName", "fingerNameFa", "polygon"],
            },
          },
        },
        required: ["nails", "skinUndertone"],
      },
    };

    let response: any = null;
    const candidateModels = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
          config: schemaConfig,
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed, trying next candidate:`, err.message);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All AI models failed to respond");
    }

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);

    // Sanitize and normalize all nail coordinates
    if (parsedData.nails) {
      parsedData.nails = sanitizeNails(parsedData.nails);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Gemini nail detection error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to detect nails",
    });
  }
});

// Endpoint: AI Photorealistic Nail Art Generation (Gemini Image Edit / Inpainting)
app.post("/api/generate-nail-art", async (req, res) => {
  try {
    const { imageBase64, polishColor, finish, design, description, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const ai = getGenAI();

    const editPrompt = `Photorealistic salon manicure retouch of this hand.
Completely cover and remove any existing nail polish, stains, chips or previous nail art.
Paint all visible fingernails with ultra-clean, salon-perfect nail polish:
- Color: ${polishColor || "Classic Elegant Nude Rose"}
- Finish: ${finish || "Gel Gloss"} with realistic curved salon top-coat glass specular highlights, natural light reflection, and subtle transverse arch shadows along the lateral edges.
- Design: ${design || "Solid color"} ${description ? `(${description})` : ""}
- Perfectly neat cuticles and pristine edge lines.
Preserve the exact skin texture, natural hand wrinkles, jewelry/rings, lighting angle, and finger positions without altering anything else.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: editPrompt,
            },
          ],
        },
      });

      let generatedImageUrl: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (generatedImageUrl) {
        return res.json({
          success: true,
          imageUrl: generatedImageUrl,
        });
      } else {
        return res.json({
          success: false,
          fallbackReason: "Model returned text instead of image data",
        });
      }
    } catch (modelErr: any) {
      console.warn("AI Image Model call returned error:", modelErr.message);
      return res.json({
        success: false,
        fallbackReason: modelErr.message,
      });
    }
  } catch (err: any) {
    console.error("AI Nail Art generation endpoint error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
