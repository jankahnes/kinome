import normalizeTags from './normalizeTags';
import { getTagByID } from '~/utils/format/getTagByID';

export default function formatRecipeOverviews(recipes: any[]): string {
  if (!recipes.length) return 'None.';
  return recipes
    .map((recipe) => {
      const tags = normalizeTags(recipe.tags ?? [])
        .slice(0, 3)
        .map((id) => getTagByID(id)?.name)
        .filter(Boolean)
        .join(', ');
      const bits = [
        recipe.rating !== 3 ? `★ ${Number(recipe.rating).toFixed(1)}` : null,
        tags ? `Tags: ${tags}` : null,
      ].filter(Boolean);
      
      let base = `[${recipe.title}](${recipe.id})${bits.length ? ` — ${bits.join(' · ')}` : ''}`;

      if (recipe.you_have?.length) {
        const yh = recipe.you_have;
        let text = '';
        if (yh.length === 1) text = yh[0];
        else if (yh.length === 2) text = yh.join(' and ');
        else text = yh.slice(0, -1).join(', ') + ', and ' + yh[yh.length - 1];
        
        base += `\n  - You have ${text} this recipe.`;
      }

      if (recipe.recommendation_reason) {
        base += `\n  - Recommended ${recipe.recommendation_reason}`;
      }

      return base;
    })
    .join('\n');
}
