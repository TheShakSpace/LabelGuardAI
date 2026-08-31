const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 90000;
const GEMINI_MAX_RETRIES = 2;

const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

function classifyGeminiStatus(status) {
  if (status === 401 || status === 403) return 'GEMINI_AUTH_ERROR';
  if (status === 404) return 'GEMINI_MODEL_ERROR';
  if (status === 400) return 'GEMINI_BAD_REQUEST';
  if (status === 429) return 'GEMINI_RATE_LIMIT';
  if (status >= 500) return 'GEMINI_SERVER_ERROR';
  return 'GEMINI_REQUEST_ERROR';
}

async function requestGemini(url, body) {
  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (response.ok) return response.json();

      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
      error.code = classifyGeminiStatus(response.status);
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === GEMINI_MAX_RETRIES) throw error;
      await wait(1000 * (2 ** attempt));
    } catch (error) {
      if (error.code && !['GEMINI_RATE_LIMIT', 'GEMINI_SERVER_ERROR'].includes(error.code)) throw error;
      if (attempt === GEMINI_MAX_RETRIES) {
        if (error.name === 'AbortError') error.code = 'GEMINI_TIMEOUT';
        if (!error.code) error.code = 'GEMINI_REQUEST_ERROR';
        throw error;
      }
      await wait(1000 * (2 ** attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Safely extracts and parses JSON from Gemini response text.
 * Handles markdown wrappers, extra text, and malformed responses.
 * 
 * @param {string} text - Raw Gemini response
 * @param {boolean} logDetails - Whether to log parsing details for debugging
 * @returns {object} Parsed JSON object with declarations
 * @throws Error if valid JSON cannot be extracted
 */
function parseStructuredResponse(text, logDetails = false) {
  if (!text || typeof text !== 'string') {
    const err = new Error('Response text is empty or not a string.');
    err.stage = 'JSON_PARSE';
    throw err;
  }

  // Step 1: Remove markdown code fences (```json, ```, etc.)
  let cleaned = text.trim();
  
  // Remove opening fence with optional json/JSON label
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/i, '');
  // Remove closing fence
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  
  cleaned = cleaned.trim();

  if (logDetails) {
    console.log(`[JSON_PARSE] Input length: ${text.length}, Cleaned length: ${cleaned.length}`);
  }

  // Step 2: Find JSON object boundaries (look for first { and last })
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx < 0 || endIdx <= startIdx) {
    const err = new Error(`Could not find valid JSON object boundaries in response (first { at ${startIdx}, last } at ${endIdx}).`);
    err.stage = 'JSON_PARSE';
    throw err;
  }

  // Step 3: Extract and parse JSON
  const jsonStr = cleaned.slice(startIdx, endIdx + 1);
  
  if (logDetails) {
    console.log(`[JSON_PARSE] Extracted JSON (first 200 chars): ${jsonStr.substring(0, 200)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    const err = new Error(`JSON.parse() failed: ${parseErr.message} at position ~${parseErr.message.match(/position (\d+)/)?.[1] || '?'}`);
    err.stage = 'JSON_PARSE';
    throw err;
  }

  // Step 4: Validate essential structure
  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Parsed JSON is not an object.');
    err.stage = 'JSON_PARSE';
    throw err;
  }

  // Must have rawText field containing the OCR text
  if (typeof parsed.rawText !== 'string' || parsed.rawText.trim() === '') {
    const err = new Error(`Response missing or invalid 'rawText' field (got type: ${typeof parsed.rawText}).`);
    err.stage = 'JSON_PARSE';
    throw err;
  }

  // Validate key declaration fields exist
  const requiredDeclarations = ['productName', 'genericName', 'mrp', 'netQuantity'];
  const missingDeclarations = requiredDeclarations.filter(
    field => !(field in parsed) || typeof parsed[field] !== 'object'
  );
  
  if (missingDeclarations.length > 0) {
    const err = new Error(`Response missing declaration fields: ${missingDeclarations.join(', ')}`);
    err.stage = 'JSON_PARSE';
    throw err;
  }

  if (logDetails) {
    console.log('[JSON_PARSE] Validation passed. Response contains rawText and all required declaration fields.');
  }

  return parsed;
}

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

/**
 * Analyzes product label images using Gemini Vision API with retry logic.
 * Extracts legal declaration fields and OCR text from front/back labels.
 * 
 * @param {string} frontImagePath - Path to front label image (optional)
 * @param {string} backImagePath - Path to back label image (optional)
 * @param {number} attemptNum - Current attempt number (for logging)
 * @returns {object} Parsed OCR result with declarations and rawText
 * @throws Error if analysis fails after retries
 */
async function analyzeImageWithGemini(frontImagePath, backImagePath, attemptNum = 1) {
  if (!GEMINI_API_KEY) {
    const err = new Error('Gemini API key is not configured on the server.');
    err.stage = 'GEMINI_AUTH';
    throw err;
  }

  // Step 1: Prepare image parts
  const parts = [];

  if (frontImagePath) {
    try {
      const frontPart = fileToGenerativePart(frontImagePath, getMimeType(frontImagePath));
      parts.push(frontPart);
      console.log(`[GEMINI] Loaded front image: ${frontImagePath}`);
    } catch (e) {
      console.error(`[GEMINI] Error reading front image: ${e.message}`);
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
      console.log(`[GEMINI] Loaded back image: ${backImagePath}`);
    } catch (e) {
      console.error(`[GEMINI] Error reading back image: ${e.message}`);
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

  // Step 2: Construct prompt with strong JSON instructions
  const promptText = `You are a Legal Metrology Compliance OCR and label verification engine.
Analyze the provided packaging label image(s) (which may be front and/or back labels of a product).
Extract the required legal declarations precisely as they are written on the package.
DO NOT infer, assume, or hallucinate any details that are not visible in the image.

CRITICAL INSTRUCTION: Your response MUST be VALID JSON only. Do NOT include any markdown, explanations, or text outside the JSON object.

If a declaration is not present or cannot be found, set its value to null, confidence to 0, and status to "Missing".
If a declaration is detected, set its status to "Detected", and estimate a realistic confidence score (0 to 100) based on OCR readability.
Specify "source" as "frontLabel" if found on front, "backLabel" if on back, or "image" if you cannot determine.

Respond with ONLY this JSON structure (no markdown, no extra text):
{
  "rawText": "Complete transcription of all readable text on the package labels",
  "productName": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "genericName": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "mrp": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "netQuantity": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "manufacturerName": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "manufacturerAddress": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "packerDetails": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "importerDetails": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "countryOfOrigin": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "consumerCare": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "manufacturingDate": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "packagingDate": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "expiryDate": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null },
  "batchNumber": { "value": string or null, "confidence": number, "status": "Detected" or "Missing", "source": "frontLabel" or "backLabel" or "image", "region": [x,y,w,h] or null }
}`;

  parts.unshift({ text: promptText });

  // Step 3: Make API request with retry logic
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  let result;
  try {
    console.log(`[GEMINI] Attempt ${attemptNum}: Sending image(s) to Gemini API...`);
    result = await requestGemini(url, {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
  } catch (e) {
    const isRetryable = ['GEMINI_TIMEOUT', 'GEMINI_RATE_LIMIT', 'GEMINI_SERVER_ERROR'].includes(e.code);
    const shouldRetry = isRetryable && attemptNum < 3;
    
    console.error(`[GEMINI] Attempt ${attemptNum} failed [${e.code || 'UNKNOWN'}]: ${e.message}`);
    
    if (shouldRetry) {
      const delay = 1000 * Math.pow(2, attemptNum - 1); // exponential backoff
      console.log(`[GEMINI] Retrying after ${delay}ms...`);
      await wait(delay);
      return analyzeImageWithGemini(frontImagePath, backImagePath, attemptNum + 1);
    }
    
    const err = new Error(e.message);
    err.stage = e.code || 'GEMINI_REQUEST_ERROR';
    throw err;
  }

  // Step 4: Extract text from response
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Gemini API returned an empty response.');
    err.stage = 'GEMINI_RESPONSE';
    throw err;
  }

  console.log(`[GEMINI] Received response: ${text.length} characters, finish_reason: ${result.candidates?.[0]?.finishReason || 'unknown'}`);

  // Step 5: Parse JSON with detailed error logging
  try {
    const parsed = parseStructuredResponse(text, true); // Enable detailed logging
    console.log(`[GEMINI] ✓ Analysis successful. Extracted rawText (${parsed.rawText?.length || 0} chars) and ${Object.keys(parsed).length - 1} declaration fields.`);
    return parsed;
  } catch (parseError) {
    console.error(`[GEMINI] JSON parsing failed: ${parseError.message}`);
    console.error(`[GEMINI] Raw response preview (first 300 chars): ${text.substring(0, 300)}`);
    throw parseError;
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
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
      }),
      signal: controller.signal
    });
  } catch (e) {
    const err = new Error(e.name === 'AbortError' ? 'Gemini API request timed out.' : `Gemini API request failed: ${e.message}`);
    err.stage = 'GEMINI_REQUEST';
    throw err;
  } finally {
    clearTimeout(timeout);
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

async function runGeminiDiagnostics() {
  const diagnostics = {
    apiKeyConfigured: Boolean(GEMINI_API_KEY),
    modelConfigured: Boolean(GEMINI_MODEL),
    model: GEMINI_MODEL,
    text: false,
    image: false
  };
  if (!GEMINI_API_KEY) return diagnostics;

  const textResult = await requestGemini(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: 'Reply with READY.' }] }], generationConfig: { maxOutputTokens: 8 } }
  );
  diagnostics.text = Boolean(textResult.candidates?.[0]);

  const onePixelPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const imageResult = await requestGemini(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: 'Describe this image briefly.' }, { inlineData: { mimeType: 'image/png', data: onePixelPng } }] }], generationConfig: { maxOutputTokens: 16 } }
  );
  diagnostics.image = Boolean(imageResult.candidates?.[0]);
  return diagnostics;
}

module.exports = {
  analyzeImageWithGemini,
  askCopilot,
  runGeminiDiagnostics
};
