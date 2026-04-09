import OpenAI from 'openai';
import { getModelConfig } from '~~/server/utils/state';
import {
  getAiResponseSchema,
  type AiResponseSchemaKey,
} from '~~/server/utils/aiResponseSchemas';

interface PictureResponseBody {
  prompt: string;
  mimetype: string;
  imageBase64: string;
  schemaKey: AiResponseSchemaKey;
}

export default defineEventHandler(async (event): Promise<any> => {
  const config = useRuntimeConfig();
  const openai = new OpenAI({ apiKey: config.gptKey });

  try {
    const body = (await readBody(event)) as PictureResponseBody;
    const prompt = body.prompt;
    const mimeType = body.mimetype;
    const base64Image = body.imageBase64;
    const schema = getAiResponseSchema(body.schemaKey);
    
    if (!base64Image) {
      throw new Error('No image file found in request');
    }

    if (!prompt) {
      throw new Error('No prompt found in request');
    }
    console.log('🔍 Starting vision call');
    // @ts-ignore - openai library is incorrectly marking 'minimal' as invalid, however gpt-5 models do support it.
    const response = await openai.responses.create({
      ...getModelConfig('vision'),
      text: {
        format: schema,
      },
      input: [
        { 
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt
            },
            {
              type: 'input_image',
              image_url: `data:${mimeType};base64,${base64Image}`,
              detail: 'auto'
            }
          ]
        }
      ],
    });
    console.log('🔍 Finished vision call');
    const rawContent = response.output_text;
    if (!rawContent) {
      throw new Error('No content returned from GPT response');
    }
    const extractedData = JSON.parse(rawContent);
    
    // Check for error responses
    if (extractedData.error) {
      throw new Error(extractedData.error);
    }

    return extractedData;
  } catch (err) {
    console.error('GPT picture analysis error:', err);
    throw err;
  }
});
