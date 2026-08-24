const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Robust path resolver relative to server root directory
function resolvePath(filePath) {
  if (!filePath) return '';
  if (path.isAbsolute(filePath) && !filePath.startsWith('/') && !filePath.startsWith('\\')) {
    return filePath;
  }
  const cleanPath = filePath.replace(/^\/+/, '');
  return path.resolve(__dirname, '..', cleanPath);
}

function fileToGenerativePart(filePath, mimeType) {
  const fullPath = resolvePath(filePath);
  if (!fs.existsSync(fullPath)) {
    const err = new Error(`File not found: ${fullPath}`);
    err.stage = 'IMAGE_PROCESSING';
    throw err;
  }
  
  const buffer = fs.readFileSync(fullPath);
  if (!buffer || buffer.length === 0) {
    const err = new Error(`Image buffer is empty: ${fullPath}`);
    err.stage = 'IMAGE_PROCESSING';
    throw err;
  }
  
  if (!mimeType || !mimeType.startsWith('image/')) {
    const err = new Error(`Invalid image MIME type: ${mimeType}`);
    err.stage = 'IMAGE_PROCESSING';
    throw err;
  }

  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic') return 'image/heic';
  if (ext === '.heif') return 'image/heif';
  return 'image/jpeg';
}

async function analyzeImageWithGemini(frontImagePath, backImagePath) {
  if (!GEMINI_API_KEY) {
    const err = new Error('Gemini API key is not configured on the server.');
    err.stage = 'GEMINI_AUTH';
    throw err;
  }

  const parts = [];

  if (frontImagePath) {
    try {
      const frontPart = fileToGenerativePart(frontImagePath, getMimeType(frontImagePath));
      parts.push(frontPart);
    } catch (e) {
      console.error('Error reading front image:', e.message);
      if (e.stage) throw e;
      const err = new Error(`Failed to read front image: ${e.message}`);
      err.stage = 'IMAGE_PROCESSING';
      throw err;
    }
  }

  if (backImagePath) {
    try {
      const backPart = fileToGenerativePart(backImagePath, getMimeType(backImagePath));
      parts.push(backPart);
    } catch (e) {
      console.error('Error reading back image:', e.message);
      if (e.stage) throw e;
      const err = new Error(`Failed to read back image: ${e.message}`);
      err.stage = 'IMAGE_PROCESSING';
      throw err;
    }
  }

  if (parts.length === 0) {
    const err = new Error('No valid images were provided for analysis.');
    err.stage = 'IMAGE_PROCESSING';
    throw err;
  }

  const promptText = `
You are a Legal Metrology Compliance OCR and label verification engine.
Analyze the provided packaging label image(s) (which may be front and/or back labels of a product).
Extract the required legal declarations precisely as they are written on the package.
DO NOT infer, assume, or hallucinate any details that are not visible in the image.
If a declaration is not present or cannot be found, set its value to null, confidence to 0, and status to "Missing".
If a declaration is detected, set its status to "Detected", and estimate a realistic confidence score (0 to 100) based on OCR readability.
Specify "source" as "frontLabel" if it was found on the front label, "backLabel" if it was on the back label, or "image" if you cannot determine.

Provide a JSON object conforming to the following structure:
{
  "productName": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "genericName": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "mrp": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "netQuantity": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "manufacturerName": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "manufacturerAddress": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "packerDetails": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "importerDetails": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "countryOfOrigin": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "consumerCare": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "manufacturingDate": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "packagingDate": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "expiryDate": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "batchNumber": { "value": string or null, "confidence": number, "status": "Detected"|"Missing", "source": "frontLabel"|"backLabel"|"image" },
  "evidence": []
}

Additionally, for any detected declarations, if you can locate the coordinates of the text region on the image, include a "region" field with normalized coordinates [x, y, width, height] where each value is a percentage from 0 to 100 relative to the image container. If coordinates are not reliably available, set "region" to null.
If the same field has conflicting values across different panels or within the same panel, set its status to "Conflict".
Provide all the extracted text in a single "rawText" field at the top level of your response, representing a raw transcription of all readable text on the package.
`;

  parts.unshift({ text: promptText });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });
  } catch (e) {
    const err = new Error(`Gemini API request failed: ${e.message}`);
    err.stage = 'GEMINI_REQUEST';
    throw err;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = errorData.error?.message || `Gemini API returned status ${response.status}`;
    const err = new Error(errMsg);
    err.stage = 'GEMINI_RESPONSE';
    throw err;
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Gemini API returned an empty response.');
    err.stage = 'GEMINI_RESPONSE';
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse Gemini output as JSON:', text);
    const err = new Error('Model returned an invalid structured response.');
    err.stage = 'JSON_PARSE';
    throw err;
  }
}

async function askCopilot(systemPrompt, userQuery) {
  if (!GEMINI_API_KEY) {
    const err = new Error('Gemini API key is not configured on the server.');
    err.stage = 'GEMINI_AUTH';
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nInspector Query: ${userQuery}` }
            ]
          }
        ]
      })
    });
  } catch (e) {
    const err = new Error(`Gemini API request failed: ${e.message}`);
    err.stage = 'GEMINI_REQUEST';
    throw err;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = errorData.error?.message || `Gemini API returned status ${response.status}`;
    const err = new Error(errMsg);
    err.stage = 'GEMINI_RESPONSE';
    throw err;
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Gemini API returned an empty response.');
    err.stage = 'GEMINI_RESPONSE';
    throw err;
  }

  return text;
}

module.exports = {
  analyzeImageWithGemini,
  askCopilot
};
