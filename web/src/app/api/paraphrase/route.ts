export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { text, tone = 'neutral' } = await req.json();
    if (!text || typeof text !== 'string') return new Response('Missing text', { status: 400 });
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return new Response('Server not configured', { status: 500 });

    const system = `You paraphrase text. Tone: ${tone}. Keep meaning, improve clarity, preserve length when possible. Return only the rewritten text.`;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
        'X-Title': 'ToolfinityAI',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4-fast:free',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'OpenRouter error');
      return new Response(errText, { status: res.status });
    }

    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content ?? '';
    return Response.json({ text: out });
  } catch (e) {
    return new Response((e as Error)?.message || 'Error', { status: 500 });
  }
}


