// OCR Service Abstraction for LabelGuard AI
const fs = require('fs');
const path = require('path');
const { analyzeImageWithGemini } = require('./geminiService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OCR_PROVIDER = process.env.OCR_PROVIDER || 'demo';
const declarationFields = [
  'productName', 'genericName', 'mrp', 'netQuantity', 'manufacturerName',
  'manufacturerAddress', 'packerDetails', 'importerDetails', 'countryOfOrigin',
  'consumerCare', 'manufacturingDate', 'packagingDate', 'expiryDate', 'batchNumber'
];

function normalizeDeclaration(field, source) {
  if (!field || typeof field !== 'object') {
    return { value: null, confidence: 0, status: 'Missing', source, region: null };
  }
  const value = typeof field.value === 'string' && field.value.trim() ? field.value.trim() : null;
  const confidence = Number.isFinite(Number(field.confidence)) ? Math.max(0, Math.min(100, Number(field.confidence))) : 0;
  return {
    value,
    confidence,
    status: value && ['Detected', 'Missing', 'Conflict', 'Low Confidence', 'Not Applicable'].includes(field.status) ? field.status : 'Missing',
    source: typeof field.source === 'string' ? field.source : source,
    region: Array.isArray(field.region) && field.region.length === 4 ? field.region : null
  };
}

// Pre-defined demo labels database (used ONLY for Demo mode)
const demoMockProducts = {
  shakti_biscuits: {
    rawText: `
SHAKTI PREMIUM BISCUITS
Rich in butter & milk
Generic Name: Biscuits
Net Quantity: 200 g
Max Retail Price (MRP): Rs 40.00
(inclusive of all taxes)
Batch No: SB-249A2
Mfd. Date: 05/2026
Best Before 6 months from packaging
Manufactured by: Shakti Consumer Products Ltd.
Address: 12, Industrial Area, Phase-3, Mumbai - 400001
Country of Origin: India
For any feedback/complaints contact Consumer Care Cell at:
Address: same as manufacturer
Phone: 1800-22-4466
Email: care@shaktiproducts.in
    `,
    declarations: {
      productName: { value: "SHAKTI PREMIUM BISCUITS", status: "Detected", confidence: 98, source: "frontLabel", region: [30, 20, 45, 12] },
      genericName: { value: "Biscuits", status: "Detected", confidence: 95, source: "frontLabel", region: [30, 35, 40, 8] },
      mrp: { value: "Rs 40.00 (inclusive of all taxes)", status: "Detected", confidence: 97, source: "backLabel", region: [15, 60, 40, 10] },
      netQuantity: { value: "200 g", status: "Detected", confidence: 94, source: "backLabel", region: [15, 72, 40, 10] },
      manufacturerName: { value: "Shakti Consumer Products Ltd.", status: "Detected", confidence: 96, source: "backLabel", region: [15, 84, 40, 10] },
      manufacturerAddress: { value: "12, Industrial Area, Phase-3, Mumbai - 400001", status: "Detected", confidence: 92, source: "backLabel", region: [15, 84, 40, 10] },
      packerDetails: { value: "", status: "Missing", confidence: 0, source: "", region: null },
      importerDetails: { value: "", status: "Missing", confidence: 0, source: "", region: null },
      countryOfOrigin: { value: "India", status: "Detected", confidence: 95, source: "backLabel", region: [15, 60, 40, 10] },
      consumerCare: { value: "Phone: 1800-22-4466, Email: care@shaktiproducts.in", status: "Detected", confidence: 93, source: "backLabel", region: [15, 84, 40, 10] },
      manufacturingDate: { value: "05/2026", status: "Detected", confidence: 97, source: "backLabel", region: [15, 60, 40, 10] },
      packagingDate: { value: "05/2026", status: "Detected", confidence: 91, source: "backLabel", region: [15, 60, 40, 10] },
      expiryDate: { value: "6 months from packaging", status: "Detected", confidence: 89, source: "backLabel", region: null },
      batchNumber: { value: "SB-249A2", status: "Detected", confidence: 98, source: "backLabel", region: null }
    }
  },
  generic_shampoo: {
    rawText: `
PURECARE SILKY SHAMPOO
Net Vol: 180 ml
Mfd by: PureCare Industries, Sector 5, Baddi, HP
MRP Rs 165
Batch: SH-103
Pkd: 04/2026
Consumer feedback call: 1800-11-2233
    `,
    declarations: {
      productName: { value: "PURECARE SILKY SHAMPOO", status: "Detected", confidence: 97, source: "frontLabel", region: [30, 20, 45, 12] },
      genericName: { value: "Shampoo", status: "Detected", confidence: 91, source: "frontLabel", region: [30, 35, 40, 8] },
      mrp: { value: "Rs 165", status: "Detected", confidence: 96, source: "backLabel", region: [15, 60, 40, 10] },
      netQuantity: { value: "180 ml", status: "Detected", confidence: 95, source: "backLabel", region: [15, 72, 40, 10] },
      manufacturerName: { value: "PureCare Industries", status: "Detected", confidence: 94, source: "backLabel", region: [15, 84, 40, 10] },
      manufacturerAddress: { value: "Sector 5, Baddi, HP", status: "Detected", confidence: 91, source: "backLabel", region: [15, 84, 40, 10] },
      packerDetails: { value: "", status: "Missing", confidence: 0, source: "", region: null },
      importerDetails: { value: "", status: "Missing", confidence: 0, source: "", region: null },
      countryOfOrigin: { value: "", status: "Missing", confidence: 0, source: "", region: null },
      consumerCare: { value: "Call: 1800-11-2233", status: "Detected", confidence: 90, source: "backLabel", region: [15, 84, 40, 10] },
      manufacturingDate: { value: "04/2026", status: "Detected", confidence: 95, source: "backLabel", region: [15, 60, 40, 10] },
      packagingDate: { value: "04/2026", status: "Detected", confidence: 95, source: "backLabel", region: [15, 60, 40, 10] },
      expiryDate: { value: "", status: "Missing", confidence: 0, source: "", region: null },
      batchNumber: { value: "SH-103", status: "Detected", confidence: 98, source: "backLabel", region: null }
    }
  }
};

/**
 * Calculates actual image dimensions & quality metrics from file buffer
 */
function getActualImageMetadata(filePath) {
  try {
    if (!filePath) {
      return null;
    }
    const cleanPath = filePath.replace(/^\/+/, '');
    const fullPath = path.isAbsolute(filePath) && !filePath.startsWith('/') && !filePath.startsWith('\\')
      ? filePath 
      : path.resolve(__dirname, '..', cleanPath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const buffer = fs.readFileSync(fullPath);
    const fileSize = buffer.length;

    let width = 1920; // default fallbacks
    let height = 1080;

    // Check PNG signature
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    }
    // Check JPEG signature
    else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0 or SOF2
          height = buffer.readUInt16BE(offset + 3);
          width = buffer.readUInt16BE(offset + 5);
          break;
        }
        offset += buffer.readUInt16BE(offset);
      }
    }
    // Check WebP signature
    else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
             buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4C) { // VP8L (lossless)
        const val = buffer.readUInt32LE(20);
        width = (val & 0x3FFF) + 1;
        height = ((val >> 14) & 0x3FFF) + 1;
      } else if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) { // VP8 (lossy)
        width = buffer.readUInt16LE(26) & 0x3FFF;
        height = buffer.readUInt16LE(28) & 0x3FFF;
      }
    }

    // Sample pixels for brightness
    let brightnessSum = 0;
    let sampleCount = 0;
    const sampleStep = Math.max(1, Math.floor(buffer.length / 5000));
    
    for (let i = 0; i < buffer.length; i += sampleStep) {
      brightnessSum += buffer[i];
      sampleCount++;
    }
    
    const brightness = Math.round((brightnessSum / sampleCount) / 255 * 100);

    // Compute contrast (variance of brightness)
    let diffSqSum = 0;
    const avgBright = brightnessSum / sampleCount;
    for (let i = 0; i < buffer.length; i += sampleStep) {
      diffSqSum += Math.pow(buffer[i] - avgBright, 2);
    }
    const contrast = Math.round(Math.min(100, Math.sqrt(diffSqSum / sampleCount) / 128 * 100));

    // Compute sharpness (adjacent differences)
    let diffSum = 0;
    for (let i = 0; i < buffer.length - sampleStep; i += sampleStep) {
      diffSum += Math.abs(buffer[i] - buffer[i + sampleStep]);
    }
    const sharpness = Math.round(Math.min(100, (diffSum / sampleCount) / 32 * 100));

    // Map to normalized scores
    const resolutionScore = Math.min(100, Math.round((width * height) / (1920 * 1080) * 100));
    const blurScore = sharpness;
    const score = Math.round((resolutionScore + blurScore + brightness + contrast) / 4);

    return {
      width,
      height,
      fileSize,
      resolutionScore,
      blurScore,
      brightness,
      contrast,
      score
    };
  } catch (e) {
    console.error("Error analyzing image quality:", e.message);
    return null;
  }
}

async function processImageOCR(frontImage, backImage, productKey = 'shakti_biscuits') {
  // 1. Analyze quality metrics from real files if available
  const frontQuality = getActualImageMetadata(frontImage) || { resolutionScore: 90, blurScore: 85, brightness: 80, contrast: 75, score: 82, width: 1920, height: 1080 };
  const backQuality = getActualImageMetadata(backImage) || { resolutionScore: 90, blurScore: 85, brightness: 80, contrast: 75, score: 82, width: 1920, height: 1080 };
  
  const combinedQuality = {
    resolutionScore: Math.round((frontQuality.resolutionScore + backQuality.resolutionScore) / 2),
    blurScore: Math.round((frontQuality.blurScore + backQuality.blurScore) / 2),
    brightness: Math.round((frontQuality.brightness + backQuality.brightness) / 2),
    contrast: Math.round((frontQuality.contrast + backQuality.contrast) / 2),
    score: Math.round((frontQuality.score + backQuality.score) / 2)
  };

  const isRealUpload = (frontImage && !frontImage.includes('demo_')) || (backImage && !backImage.includes('demo_'));

  // 2. OCR Extraction Core
  if (isRealUpload && OCR_PROVIDER === 'gemini') {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    
    console.log('Sending real image(s) to Gemini Vision API for extraction...');
    try {
      const geminiResult = await analyzeImageWithGemini(frontImage, backImage);
      
      return {
        rawText: geminiResult.rawText || 'OCR transcript unavailable.',
        declarations: Object.fromEntries(declarationFields.map(field => [
          field,
          normalizeDeclaration(geminiResult[field], field === 'productName' || field === 'genericName' ? 'frontLabel' : 'backLabel')
        ])),
        preprocessingStats: {
          resolution: `${frontQuality.width} × ${frontQuality.height}`,
          blur: combinedQuality.blurScore > 75 ? "Low" : (combinedQuality.blurScore > 45 ? "Medium" : "High"),
          lighting: combinedQuality.brightness > 70 ? "Good" : (combinedQuality.brightness > 40 ? "Adequate" : "Needs Review"),
          ocrReadiness: combinedQuality.score > 80 ? "Excellent" : (combinedQuality.score > 50 ? "Good" : "Poor"),
          qualityScore: combinedQuality.score,
          analysisType: "REAL AI ANALYSIS"
        },
        qualityMetrics: combinedQuality
      };
    } catch (e) {
      console.error('Gemini OCR API request failed:', e.message);
      const error = new Error(`AI analysis temporarily unavailable: ${e.message}`);
      error.stage = e.stage || 'GEMINI_REQUEST_ERROR';
      throw error;
    }
  }

  // Graceful Fallback / Demo Mode
  const data = demoMockProducts[productKey] || demoMockProducts['shakti_biscuits'];

  return {
    rawText: data.rawText,
    declarations: data.declarations,
    preprocessingStats: {
      resolution: "2048 × 1536",
      blur: "Low",
      lighting: "Good",
      ocrReadiness: "Excellent",
      qualityScore: combinedQuality.score,
      analysisType: "DEMO ANALYSIS"
    },
    qualityMetrics: combinedQuality
  };
}

module.exports = { processImageOCR };
