import fetch from 'node-fetch';

export async function askGemini(prompt, apiKey) {
  // Gemini API endpoint (example, update as needed)
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Gemini API error: ' + res.statusText);
  const data = await res.json();
  // Extract the text answer
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer.';
}
