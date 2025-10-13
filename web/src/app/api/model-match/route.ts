export const runtime = 'nodejs';
export const maxDuration = 30;

type AllowedModel = {
  id: string;
  name: string;
  strengths: string[];
};

const ALLOWED_MODELS: AllowedModel[] = [
  {
    id: 'x-ai/grok-4-fast:free',
    name: 'Grok 4 Fast (free)',
    strengths: ['very long context (2M tokens)', 'general reasoning', 'multimodal input', 'cost-free tier'],
  },
  {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    strengths: ['state-of-the-art reasoning', 'very long context (2M tokens)', 'multimodal input'],
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    strengths: ['good general assistant', 'runs fast', 'open-weight ecosystem'],
  },
  {
    id: 'mistralai/mixtral-8x7b-instruct',
    name: 'Mixtral 8x7B Instruct',
    strengths: ['strong coding', 'reasonably fast', 'good long-form reasoning'],
  },
  {
    id: 'qwen/qwen-2.5-7b-instruct',
    name: 'Qwen2.5 7B Instruct',
    strengths: ['math-friendly', 'multilingual', 'fast responses'],
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    strengths: ['strong vision', 'fast', 'good for tool-use and extraction'],
  },
  {
    id: 'google/gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    strengths: ['latest gemini generation', 'multimodal', 'long context', 'strong tool-use'],
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o mini',
    strengths: ['high quality multimodal', 'fast', 'cost-efficient'],
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    strengths: ['SOTA reasoning', 'coding & math', 'multimodal', 'broad domain coverage'],
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    strengths: ['deep reasoning', 'long context', 'strong writing & analysis', 'safety'],
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    strengths: ['reasoning', 'math-heavy tasks', 'cost-efficient'],
  },
];

export async function POST(req: Request) {
  try {
    const { applyRateLimit } = await import('@/lib/rateLimit');
    const limited = applyRateLimit(req, { routeName: 'model-match', points: 10, intervalMs: 43_200_000 });
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const goal = (body?.goal as string) || (body?.text as string) || '';
    if (!goal) return new Response('Missing goal', { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_OPENAI_KEY;
    if (!apiKey) return new Response('Server not configured', { status: 500 });

    const list = ALLOWED_MODELS.map((m) => `- id: ${m.id}\n  name: ${m.name}\n  strengths: ${m.strengths.join(', ')}`).join('\n');
    const system = [
      'You are a PRECISE model-selection assistant.',
      'Pick exactly ONE model **(THE BEST MODEL)** from the allowed list that BEST fits the user\'s goal.',
      'Consider: modality needs (text/vision/audio), coding/math ability, long-context, speed, and cost.',
      'Output STRICT JSON only with keys: modelId, modelName, summary. No extra text.',
      'If multiple fit, choose the single **BEST** and mention the main tradeoff briefly in summary.',
      `Allowed models:\n${list}`,
    ].join('\n');

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
          { role: 'user', content: `User goal: ${goal}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'OpenAI error');
      return new Response(errText, { status: res.status });
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    type ModelSelection = { modelId: string; modelName: string; summary: string };
    let parsed: Partial<ModelSelection> | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }
    }
    if (!parsed || !parsed.modelId || !parsed.modelName || !parsed.summary) {
      // Fallback: default to GPT-4o mini with a generic rationale
      parsed = {
        modelId: 'openai/gpt-4o-mini',
        modelName: 'GPT-4o mini',
        summary: 'General-purpose, cost-efficient OpenAI model with strong quality-speed balance.',
      };
    }
    return Response.json(parsed);
  } catch (e) {
    return new Response((e as Error)?.message || 'Error', { status: 500 });
  }
}


