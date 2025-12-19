import OpenAI from 'openai';
import { getModelConfig } from '~~/server/utils/state';

export default defineEventHandler(async (event): Promise<string> => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const openai = new OpenAI({ apiKey: config.gptKey });
  let cfg = null;
  if (body?.externalFast) {
    cfg = { model: 'gpt-5.2', reasoning: { effort: 'none' } };
  } else if (body?.external) {
    cfg = { model: 'gpt-5.2', reasoning: { effort: 'low' } };
  } else {
    cfg = getModelConfig(body.type);
  }
  try {
    // @ts-ignore - openai library is incorrectly marking 'minimal' as invalid, however gpt-5 models do support it.
    const response = await openai.responses.create({
      ...cfg,
      instructions: body.systemPrompt,
      input: body.message,
    });
    const raw = response.output_text;
    if (!raw) throw new Error('No content returned from GPT response');
    return raw;
  } catch (err) {
    console.error('GPT error 765:', err);
    throw err;
  }
});
