import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { action, apiKey, model = 'gemini-2.5-flash', temperature = 0.1, prompt, systemInstruction, responseSchema } = req.body || {};

  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!resolvedApiKey) {
    return res.status(400).json({ error: 'No Gemini API key provided in request or environment.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${resolvedApiKey}`;

    let bodyPayload: any;

    if (action === 'test') {
      bodyPayload = {
        contents: [{ parts: [{ text: 'Respond with exactly: OK' }] }],
        generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
      };
    } else {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });

    const data = await geminiRes.json();
    return res.status(geminiRes.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Server error proxying to Gemini API' });
  }
}
