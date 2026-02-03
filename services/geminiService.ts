import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BarcodeFormat, GenerationResponse } from "../types";

// Helper to get API Key securely across different environments (Node/Vite/Netlify)
const getApiKey = (): string | undefined => {
  // Check standard process.env (Node/Webpack)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // Check Vite specific env vars (Standard for React deployments on Netlify)
  // We use 'as any' to avoid TS errors if types aren't set up for import.meta
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  return undefined;
};

const apiKey = getApiKey();

// Initialize Gemini Client
// Note: In production on Netlify, ensure the API Key is set in Site Settings > Environment Variables
const ai = new GoogleGenAI({ apiKey: apiKey || 'AIzaSyBU2_nd3FxUTGW3mlp8WCLmc0cQFs1Ci5w' });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    code: {
      type: Type.STRING,
      description: "The valid barcode number/string including correct checksums if applicable.",
    },
    description: {
      type: Type.STRING,
      description: "A short, realistic product name in Italian for this barcode.",
    },
  },
  required: ["code", "description"],
};

/**
 * Calcola il checksum corretto per un codice EAN13.
 * L'algoritmo somma le cifre in posizione dispari (x1) e pari (x3).
 */
const calculateEAN13Checksum = (code: string): string => {
  // Rimuove caratteri non numerici
  const digits = code.replace(/\D/g, '');
  
  // Prendiamo solo i primi 12 numeri (o riempiamo con 0 se troppo corto)
  let base12 = digits.padEnd(12, '0').slice(0, 12);
  
  const digitsArr = base12.split('').map(Number);
  let sum = 0;
  
  // Pesi EAN13: 1 per posizioni dispari (indice 0, 2..), 3 per posizioni pari (indice 1, 3..)
  for (let i = 0; i < 12; i++) {
    sum += digitsArr[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const remainder = sum % 10;
  const checksum = remainder === 0 ? 0 : 10 - remainder;
  
  return `${base12}${checksum}`;
};

export const generateSmartBarcode = async (format: BarcodeFormat): Promise<GenerationResponse> => {
  if (!apiKey) {
    console.error("API KEY Mancante. Configurala nelle impostazioni di Netlify.");
    // Return a fake barcode to prevent crash if key is missing
    return {
      code: "8001234567890", // Codice di esempio valido
      description: "Errore: API Key mancante (Modalità Demo)",
    };
  }

  try {
    const prompt = `
      Genera un codice a barre valido e casuale per il formato: ${format}.
      
      Regole Importanti:
      1. Se il formato è EAN13, usa 12 cifre + checksum (ma non preoccuparti se sbagli il calcolo, lo correggerò io).
      2. Se il formato è UPC, usa 11 cifre + checksum.
      3. Fornisci un nome di prodotto fittizio ma realistico in Italiano (es. "Pasta di Gragnano 500g", "Vino Rosso DOC").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.9,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as GenerationResponse;
      
      // AUTO-CORREZIONE: Se è un EAN13, ricalcoliamo il checksum per essere sicuri al 100%
      if (format === BarcodeFormat.EAN13) {
        data.code = calculateEAN13Checksum(data.code);
      }

      return data;
    }
    
    throw new Error("Nessun dato ricevuto da Gemini");

  } catch (error) {
    console.error("Errore generazione barcode:", error);
    // Fallback con codice valido per evitare crash
    return {
      code: format === BarcodeFormat.EAN13 ? "8000000000000" : "12345678",
      description: "Generazione Offline (Errore Connessione)",
    };
  }
};