import Tesseract from 'tesseract.js';

// Predefined list of known UP cities, districts, route towns, and keywords from the handwritten sheet
const KNOWN_UP_KEYWORDS = [
  // Route sheet items
  "Agra", "Aligarh", "Atrauli", "Auraiya", "Babina", "Banda", "Bela", 
  "Chhibramau", "Chibramau", "Chitrakoot", "Etah", "Etawah", "Farrukhabad", 
  "Fatehabad", "Firozabad", "Ghaziabad", "Hathras", "Iglas", "Iglash", 
  "Jalaun", "Jhansi", "Kaimganj", "Kasganj", "Lalitpur", "Mahoba", 
  "Mainpuri", "Mathura", "Orai", "Sikandrabad", "Tirwa", 
  "Sunday", "Leave", "Meeting",

  // Major UP Districts, Cities, and Route Towns
  "Kanpur", "Lucknow", "Varanasi", "Prayagraj", "Allahabad", "Meerut", 
  "Bareilly", "Noida", "Gorakhpur", "Moradabad", "Saharanpur", "Ayodhya", 
  "Faizabad", "Muzaffarnagar", "Lakhimpur", "Kheri", "Shahjahanpur", 
  "Budaun", "Pilibhit", "Rampur", "Hapur", "Amroha", "Hardoi", "Sitapur", 
  "Unnao", "Rae Bareli", "Amethi", "Sultanpur", "Barabanki", "Bahraich", 
  "Shravasti", "Balrampur", "Gonda", "Siddharthnagar", "Basti", 
  "Sant Kabir Nagar", "Maharajganj", "Kushinagar", "Deoria", "Azamgarh", 
  "Mau", "Ballia", "Jaunpur", "Ghazipur", "Chandauli", "Mirzapur", 
  "Sonbhadra", "Bhadohi", "Pratapgarh", "Kaushambi", "Fatehpur", 
  "Hamirpur", "Kannauj", "Sikandra Rao", "Sikandra", "Tirwaganj"
];

/**
 * Calculates the Levenshtein edit distance between two strings.
 */
const getLevenshteinDistance = (a, b) => {
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
};

/**
 * Fuzzy matches and auto-corrects individual tokens or full texts against known UP cities and keywords.
 * @param {string} text - Scanned raw text line
 * @returns {string} - Corrected text
 */
export const fuzzyCorrectText = (text) => {
  if (!text) return "";

  const tokens = text.split(/(\s+|\+|➔|→)/);
  
  const correctedTokens = tokens.map(token => {
    const cleanToken = token.trim();
    if (cleanToken.length < 3 || /^\d+$/.test(cleanToken)) return token;

    let bestMatch = cleanToken;
    let minDistance = 3; // Allow up to 2 character edits

    for (const keyword of KNOWN_UP_KEYWORDS) {
      const distance = getLevenshteinDistance(cleanToken, keyword);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = keyword;
      }
    }
    
    if (bestMatch !== cleanToken) {
      if (cleanToken === cleanToken.toUpperCase()) {
        return bestMatch.toUpperCase();
      }
      return bestMatch;
    }
    
    return token;
  });

  return correctedTokens.join('');
};

/**
 * Preprocesses an image file using an HTML5 Canvas to optimize it for Tesseract OCR.
 */
export const preprocessImage = (fileObject) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(fileObject);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxDim = 1500;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const threshold = 135;
        const binaryColor = gray < threshold ? 0 : 255;
        data[i] = binaryColor;
        data[i + 1] = binaryColor;
        data[i + 2] = binaryColor;
      }
      
      ctx.putImageData(imgData, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    
    img.onerror = (err) => {
      reject(new Error("Failed to load image file for preprocessing."));
    };
  });
};

/**
 * Parses raw text lines into S.No. and Name rows, applying spelling auto-corrections.
 */
export const parseTextToList = (text) => {
  if (!text) return [];

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const rows = [];

  const listRegex = /^\s*\(?(\d+)\)?[\s-.:=➔→]+(.*)$/i;

  lines.forEach((line, index) => {
    let sNo = '';
    let name = line;

    const match = line.match(listRegex);
    if (match) {
      sNo = match[1];
      name = match[2];
    }

    name = name.replace(/[-➔→=\s|]+$/g, '').trim();

    if (name.toLowerCase() === 'name' || name.toLowerCase() === 's.no' || name.toLowerCase() === 'sno') return;

    const correctedName = fuzzyCorrectText(name);

    rows.push({
      id: `row-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`,
      sNo: sNo || String(index + 1),
      name: correctedName
    });
  });

  return rows;
};

/**
 * Sends image data to Gemini 2.0 Flash API.
 */
const scanImageWithGemini = async (fileObject, apiKey) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileObject);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const prompt = "You are an OCR assistant reading a handwritten log/sheet. Extract every row as a JSON array of objects with fields: sNo, name. For example: sNo: '1', name: 'LEAVE'. Return ONLY valid JSON, no markdown, no explanation.";

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: fileObject.type,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini OCR error: ${errorMessage}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) throw new Error("Gemini returned an empty response.");

  let jsonText = rawText.trim();
  if (jsonText.startsWith("```json")) jsonText = jsonText.substring(7);
  else if (jsonText.startsWith("```")) jsonText = jsonText.substring(3);
  if (jsonText.endsWith("```")) jsonText = jsonText.substring(0, jsonText.length - 3);
  jsonText = jsonText.trim();

  const parsed = JSON.parse(jsonText);
  return parsed.map((item, idx) => ({
    id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
    sNo: item.sNo !== null && item.sNo !== undefined ? String(item.sNo) : String(idx + 1),
    name: fuzzyCorrectText(item.name || '')
  }));
};

/**
 * Sends image data to free OCR.space API.
 */
const scanImageWithOcrSpace = async (fileObject, apiKey) => {
  const formData = new FormData();
  formData.append('file', fileObject);
  formData.append('apikey', apiKey);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('OCREngine', '2'); // Engine 2 is optimized for search/handwriting
  formData.append('detectOrientation', 'true');

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`OCR.space API error: Status ${response.status}`);
  }

  const data = await response.json();
  
  if (data.IsErroredOnProcessing) {
    const errorMessage = data.ErrorMessage?.[0] || "Failed to process image.";
    throw new Error(`OCR.space error: ${errorMessage}`);
  }

  const parsedText = data.ParsedResults?.[0]?.ParsedText;
  if (!parsedText) {
    throw new Error("OCR.space returned no text results. Please make sure the photo is clear.");
  }

  return parseTextToList(parsedText);
};

/**
 * Universal scan function routing.
 */
export const scanExpenseImage = async (fileObject, apiKey = '', onProgress = () => {}) => {
  if (!fileObject) throw new Error("No image file selected.");

  // Load from Vite's env variables or fallback to hardcoded value
  const key = (import.meta.env.VITE_OCR_SPACE_API_KEY || "K82746191888957").trim();

  if (key !== '') {
    if (key.startsWith('AIzaSy') || key.startsWith('AQ.')) {
      return await scanImageWithGemini(fileObject, key);
    } else {
      return await scanImageWithOcrSpace(fileObject, key);
    }
  }

  // Fallback to local Tesseract OCR
  try {
    const processedCanvas = await preprocessImage(fileObject);
    const result = await Tesseract.recognize(
      processedCanvas,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            onProgress(Math.round(m.progress * 100));
          }
        }
      }
    );
    return parseTextToList(result.data.text);
  } catch (error) {
    console.error("Local OCR Error:", error);
    throw new Error(`Local OCR processing failed: ${error.message || error}`);
  }
};
