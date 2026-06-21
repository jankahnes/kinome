import OpenAI from 'openai';

// Streaming chat endpoint used by the external "rechat" frontend so it never
// needs the OpenAI token. Intentionally open (no auth) — see CORS below.
//
// NOTE: this is `stream.ts`, not `stream.post.ts`, on purpose — a `.post`
// handler never receives the CORS preflight (an OPTIONS request), so the
// preflight would 405 without CORS headers and the browser blocks the call.
// We handle the method dispatch ourselves instead.
interface StreamBody {
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export default defineEventHandler(async (event) => {
  // Open CORS: rechat runs on a different origin. `*` is fine since this is
  // intentionally public. Anti-buffering headers keep SSE incremental through
  // nginx (X-Accel-Buffering) and Cloudflare.
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Accel-Buffering': 'no',
    'Cache-Control': 'no-cache',
  });

  // CORS preflight.
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return null;
  }
  if (event.method !== 'POST') {
    setResponseStatus(event, 405);
    return 'Method Not Allowed';
  }

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
