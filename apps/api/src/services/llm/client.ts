import { GoogleGenerativeAI } from '@google/generative-ai';
import pRetry from 'p-retry';
import PQueue from 'p-queue';
import { config } from '../../config';

// Queue to enforce max concurrency & rate limits (Gemini free tier: 10 RPM)
const llmQueue = new PQueue({
  concurrency: 1,
  interval: 6000, // 6 seconds per request = 10 RPM
  intervalCap: 1,
});

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
}

export interface GenerateJsonOptions {
  systemInstruction?: string;
  prompt: string;
  schemaDescription?: string;
}

/**
 * Prompt Injection Protection: Wrap untrusted user or crawled text in secure data delimiters.
 */
export function sanitizeAndDelimitText(tag: string, text: string): string {
  // Escape any existing closing tags in text
  const safeText = text.replace(new RegExp(`</${tag}>`, 'gi'), `[/${tag}]`);
  return `<${tag}>\n${safeText}\n</${tag}>`;
}

/**
 * Call Gemini API with structured JSON response enforcement, retries, and rate limiting.
 */
export async function generateStructuredJson<T>(options: GenerateJsonOptions): Promise<T> {
  return llmQueue.add(async () => {
    return pRetry(
      async () => {
        const ai = getGenAI();
        const modelName = config.geminiModel || 'gemini-2.5-flash';
        
        const model = ai.getGenerativeModel({
          model: modelName,
          systemInstruction: options.systemInstruction || 
            'You are an expert AI interview coach and tech recruiter. You MUST return valid JSON adhering strictly to the requested schema. Do not include markdown code blocks (```json ... ```) or any preamble text outside the JSON object.',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2, // Low temperature for consistent, structured outputs
          },
        });

        let fullPrompt = options.prompt;
        if (options.schemaDescription) {
          fullPrompt += `\n\nREQUIRED JSON SCHEMA DESCRIPTION:\n${options.schemaDescription}`;
        }

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const rawText = response.text();

        // Clean up markdown code blocks if the model included them despite responseMimeType
        let jsonText = rawText.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        try {
          const parsed = JSON.parse(jsonText) as T;
          return parsed;
        } catch (err) {
          console.error('[LLM] Failed to parse JSON response:', rawText.slice(0, 300));
          throw new Error(`Invalid JSON returned by LLM: ${(err as Error).message}`);
        }
      },
      {
        retries: 3,
        minTimeout: 2000,
        factor: 2,
        onFailedAttempt: (error) => {
          console.warn(
            `[LLM] Request failed (attempt ${error.attemptNumber}/${error.attemptNumber + error.retriesLeft}): ${error.message}`
          );
        },
      }
    );
  }) as Promise<T>;
}
