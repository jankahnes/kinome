import removeInstructionFormatting from '~/utils/format/removeInstructionFormatting';

export default defineEventHandler(async (event) => {
  const base_recipe_information = await readBody(event);
  if (base_recipe_information.original_image_base64) {
    // Route user-uploaded photo through the same flux-editing pipeline as video stills:
    // enhance plating/garnish, place on white background, remove bg — matches app's visual style.
    try {
      const imageGenerationData = {
        title: base_recipe_information.title,
        instructions: removeInstructionFormatting(base_recipe_information.instructions || []),
        collection: base_recipe_information?.collection || 'user-generated',
        video_url: null,
        user_image_base64: base_recipe_information.original_image_base64,
      };
      const response = await fetch(
        'https://jk-api.onrender.com/generate-image-from-recipe-data',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageGenerationData),
        },
      );
      if (response.ok) {
        const processedBuffer = await response.arrayBuffer();
        base_recipe_information.image_base64 = `data:image/png;base64,${Buffer.from(processedBuffer).toString('base64')}`;
      } else {
        console.error('Failed to process user image:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to process user image:', error);
    }
  } else {
    // Generate image from recipe data
    try {
      const videoUrl =
        base_recipe_information.source_type === 'MEDIA' &&
        base_recipe_information.source != null
          ? base_recipe_information.source
          : null;
      const imageGenerationData = {
        title: base_recipe_information.title,
        instructions: removeInstructionFormatting(base_recipe_information.instructions || []),
        collection: base_recipe_information?.collection || "user-generated",
        video_url: videoUrl,
      };
      const response = await fetch(
        'https://jk-api.onrender.com/generate-image-from-recipe-data',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageGenerationData),
        }
      );
      if (response.ok) {
        const generatedImageBuffer = await response.arrayBuffer();
        const generatedImageBase64 = `data:image/png;base64,${Buffer.from(
          generatedImageBuffer
        ).toString('base64')}`;
        base_recipe_information.image_base64 = generatedImageBase64;
      }
      else {
        console.error('Failed to generate image:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
    }
  }
  return base_recipe_information;
});
