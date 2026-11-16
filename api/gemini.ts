import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { action, apiKey, model: requestedModel = 'gemini-flash-latest', temperature = 0.1, prompt, systemInstruction, responseSchema } = req.body || {};

  // Normalize legacy/deprecated models to active Gemini models
  let model = requestedModel;
  if (!model || model.includes('gemini-2.0') || model.includes('gemini-2.5-flash')) {
    model = 'gemini-flash-latest';
  } else if (model.includes('gemini-2.5-pro')) {
    model = 'gemini-3.1-pro-preview';
  }

  const resolvedApiKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();

  if (!resolvedApiKey) {
    return res.status(400).json({ error: 'No Gemini API key provided in request or environment.' });
  }

  try {
    let url: string;
    let bodyPayload: any;

    if (action === 'test') {
      // Use countTokens for instantaneous (100ms) connection validation with zero token generation latency
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens?key=${encodeURIComponent(resolvedApiKey)}`;
      bodyPayload = {
        contents: [{ parts: [{ text: 'test' }] }],
      };
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(resolvedApiKey)}`;
      bodyPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
          responseSchema,
        },
      };

      if (systemInstruction) {
        bodyPayload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }
    }

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': resolvedApiKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await geminiRes.json();
    return res.status(geminiRes.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Server error proxying to Gemini API' });
  }
}
