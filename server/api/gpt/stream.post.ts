import OpenAI from 'openai';

// Streaming chat endpoint used by the external "rechat" frontend so it never
// needs the OpenAI token. Intentionally open (no auth) — see CORS below.
interface StreamBody {
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export default defineEventHandler(async (event) => {
  // Open CORS: rechat runs on a different origin. `*` is fine since this is
  // intentionally public. Includes the OPTIONS preflight that a POST with a
  // JSON content-type triggers.
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    // Defeat response buffering so SSE streams incrementally through
    // nginx (X-Accel-Buffering) and stays uncached at every hop.
    'X-Accel-Buffering': 'no',
    'Cache-Control': 'no-cache',
  });
  if (event.method === 'OPTIONS') return null;

  const config = useRuntimeConfig();
  const body = await readBody<StreamBody>(event);
  const openai = new OpenAI({ apiKey: config.gptKey });

  const stream = await openai.responses.create({
    model: 'gpt-5.4-mini',
    reasoning: { effort: 'medium', summary: 'auto' },
    input: body.messages,
    stream: true,
  });

  // Forward OpenAI's typed deltas through as-is so the frontend parser
  // (which keys off these event `type`s) needs no translation.
  const es = createEventStream(event);
  (async () => {
    try {
      for await (const ev of stream) {
        if (
          ev.type === 'response.reasoning_summary_text.delta' ||
          ev.type === 'response.output_text.delta'
        ) {
          await es.push(JSON.stringify({ type: ev.type, delta: ev.delta }));
        }
      }
    } catch (err) {
      console.error('GPT stream error:', err);
    } finally {
      await es.close();
    }
  })();

  return es.send();
});
