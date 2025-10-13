export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { applyRateLimit } = await import('@/lib/rateLimit');
    const limited = applyRateLimit(req, { routeName: 'paraphrase', points: 10, intervalMs: 43_200_000 });
    if (limited) return limited;

    const { text, tone = 'neutral' } = await req.json();
    if (!text || typeof text !== 'string') return new Response('Missing text', { status: 400 });
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_OPENAI_KEY;
    if (!apiKey) return new Response('Server not configured', { status: 500 });

    const system = `You paraphrase text. Tone: ${tone}. Keep meaning, improve clarity, preserve length when possible. Return only the rewritten text.`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'OpenAI error');
      return new Response(errText, { status: res.status });
    }

    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content ?? '';
    return Response.json({ text: out });
  } catch (e) {
    return new Response((e as Error)?.message || 'Error', { status: 500 });
  }
}


