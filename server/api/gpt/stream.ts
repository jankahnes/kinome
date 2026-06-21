import OpenAI from 'openai';

// Streaming chat endpoint used by the external "rechat" frontend so it never
// needs the OpenAI token. Intentionally open (no auth) — see CORS below.
//
// NOTE: `stream.ts`, not `stream.post.ts`, on purpose — a `.post` handler never
// receives the CORS preflight (OPTIONS), so we dispatch on method ourselves.
//
// Tools: the frontend passes its own function definitions. We don't execute
// anything here — each tool call is forwarded to the client as a `tool_call`
// event and auto-acknowledged with {"ok":true} so the model keeps going. The
// tools are therefore pure UI directives (set title, cite, propose…), not
// server-side actions.
interface StreamBody {
  messages: { role: 'user' | 'assistant'; content: string }[];
  tools?: unknown[];
  instructions?: string;
}

const MAX_TURNS = 6; // guard against a tool-call loop that never settles

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Accel-Buffering': 'no',
    'Cache-Control': 'no-cache',
  });
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

  const es = createEventStream(event);

  (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let input: any = body.messages;
      let prevId: string | undefined;

      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const stream = await openai.responses.create({
          model: 'gpt-5.4-mini',
          reasoning: { effort: 'medium', summary: 'auto' },
          instructions: body.instructions,
          input,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: body.tools as any,
          previous_response_id: prevId,
          stream: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let final: any;
        for await (const ev of stream) {
          if (
            ev.type === 'response.output_text.delta' ||
            ev.type === 'response.reasoning_summary_text.delta'
          ) {
            await es.push(JSON.stringify({ type: ev.type, delta: ev.delta }));
          } else if (ev.type === 'response.completed') {
            final = ev.response;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calls = (final?.output ?? []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o: any) => o.type === 'function_call',
        );
        if (!calls.length) break; // final turn produced only text → done

        // Forward each call to the client, then auto-ack so the model continues.
        for (const c of calls) {
          await es.push(
            JSON.stringify({
              type: 'tool_call',
              name: c.name,
              arguments: c.arguments, // raw JSON string; parsed client-side
              call_id: c.call_id,
            }),
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input = calls.map((c: any) => ({
          type: 'function_call_output',
          call_id: c.call_id,
          output: '{"ok":true}',
        }));
        prevId = final.id;
      }
    } catch (err) {
      console.error('GPT stream error:', err);
    } finally {
      await es.close();
    }
  })();

  return es.send();
});
