/**
 * Gemini Client Service
 * Handles direct or serverless proxy requests to Google Gemini models.
 * Supports connection diagnostics, structured JSON generation with responseSchema,
 * rate limit detection, and token usage accounting.
 */

export type AiConnectionStatus = 'unconfigured' | 'connected' | 'invalid' | 'ratelimited' | 'error';

export interface GeminiConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  useProxy: boolean;
}

export interface TestConnectionResult {
  status: AiConnectionStatus;
  message: string;
}

/**
 * Tests connection with Google Gemini by sending a lightweight token check.
 */
export async function testGeminiConnection(
  apiKey: string,
  model: string = 'gemini-flash-latest',
  useProxy: boolean = false
): Promise<TestConnectionResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return {
      status: 'unconfigured',
      message: 'No API key provided.',
    };
  }

  // Normalize deprecated or unavailable models to active models
  let activeModel = model;
  if (!activeModel || activeModel.includes('gemini-2.0') || activeModel.includes('gemini-2.5-flash')) {
    activeModel = 'gemini-flash-latest';
  } else if (activeModel.includes('gemini-2.5-pro')) {
    activeModel = 'gemini-3.1-pro-preview';
  }

  try {
    let url: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': cleanKey,
    };
    let body: any;

    if (useProxy) {
      url = '/api/gemini';
      body = JSON.stringify({
        action: 'test',
        apiKey: cleanKey,
        model: activeModel,
      });
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:countTokens?key=${encodeURIComponent(cleanKey)}`;
      body = JSON.stringify({
        contents: [
          {
            parts: [{ text: 'test' }],
          },
        ],
      });
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (res.ok) {
      return {
        status: 'connected',
        message: `Successfully connected to ${activeModel}! AI timetable assistance is active.`,
      };
    }

    const errData = await res.json().catch(() => ({}));
    const detailedMessage = (typeof errData?.error === 'string' ? errData.error : errData?.error?.message) || errData?.message || '';

    if (res.status === 429) {
      return {
        status: 'ratelimited',
        message: detailedMessage || 'Gemini API quota exceeded or rate limit reached. Please wait a moment or check your tier.',
      };
    }

    if (res.status === 400 || res.status === 403) {
      // If the error is specifically about the model being retired or not found
      if (/not found|no longer available|unsupported/i.test(detailedMessage)) {
        return {
          status: 'error',
          message: detailedMessage,
        };
      }
      return {
        status: 'invalid',
        message: detailedMessage || 'Invalid API key or unauthorized permissions. Please check your Google AI Studio key.',
      };
    }

    if (res.status === 404) {
      return {
        status: 'error',
        message: detailedMessage || `Model '${activeModel}' not found. Please choose an active model like gemini-flash-latest or gemini-3.8-flash.`,
      };
    }

    return {
      status: 'error',
      message: detailedMessage || `Gemini API returned status ${res.status}.`,
    };
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Network error connecting to Gemini API. Check your internet connection.',
    };
  }
}

/**
 * Sends a structured generation request to Gemini, expecting JSON response.
 */
export async function callGeminiStructured<T>(
  apiKey: string,
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    useProxy?: boolean;
    systemInstruction?: string;
    responseSchema?: any;
    signal?: AbortSignal;
  } = {}
): Promise<{ data: T; tokensUsed?: number }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Missing Gemini API key. Please configure your key in Settings > AI Assistant.');
  }

  const requestedModel = options.model || 'gemini-flash-latest';
  let model = requestedModel;
  if (!model || model.includes('gemini-2.0') || model.includes('gemini-2.5-flash')) {
    model = 'gemini-flash-latest';
  } else if (model.includes('gemini-2.5-pro')) {
    model = 'gemini-3.1-pro-preview';
  }
  const temperature = options.temperature !== undefined ? options.temperature : 0.1;
  const useProxy = options.useProxy || false;

  let url: string;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-goog-api-key': cleanKey,
  };
  let bodyPayload: any;

  if (useProxy) {
    url = '/api/gemini';
    bodyPayload = {
      action: 'generate',
      apiKey: cleanKey,
      model,
      temperature,
      prompt,
      systemInstruction: options.systemInstruction,
      responseSchema: options.responseSchema,
    };
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    bodyPayload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
        responseSchema: options.responseSchema,
      },
    };

    if (options.systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
    signal: options.signal,
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 403) {
      throw new Error('Invalid Gemini API key. Please re-enter your key in Settings > AI Assistant.');
    }
    if (res.status === 429) {
      throw new Error('Gemini API rate limit reached (429). The system will back off and retry.');
    }
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const jsonResponse = await res.json();
  const rawText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
  const tokensUsed = jsonResponse?.usageMetadata?.totalTokenCount || 0;

  if (!rawText) {
    throw new Error('Gemini API returned an empty response.');
  }

  // Sanitize any accidental markdown code fences
  const sanitizedText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const parsedData = JSON.parse(sanitizedText) as T;
    return { data: parsedData, tokensUsed };
  } catch (err) {
    throw new Error(`Failed to parse Gemini response as JSON: ${sanitizedText.slice(0, 150)}`);
  }
}
