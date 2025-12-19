import OpenAI from 'openai';

export default defineEventHandler(async (event): Promise<number[]> => {
  const config = useRuntimeConfig();
  const { query } = await readBody(event);
  if (!query?.trim()) throw createError({ statusCode: 400, message: 'query is required' });

  const openai = new OpenAI({ apiKey: config.gptKey });
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
    dimensions: 256,
  });

  return embeddingResponse.data[0].embedding;
});
