import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { action, apiKey, model = 'gemini-3.8-flash', temperature = 0.1, prompt, systemInstruction, responseSchema } = req.body || {};

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
