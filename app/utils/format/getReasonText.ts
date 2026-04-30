import { getTagByID } from '~/utils/format/getTagByID';
import capitalize from '~/utils/format/capitalize';

type RecommendationRow = RecipeOverview & {
  nearest_recipe: {
    id: number;
    title: string;
    set: 'own' | 'bookmarks' | 'ratings';
  } | null;
  matched_tags: number[];
  dominant_signal: 'taste' | 'tags' | 'trending';
};

function tagReasonText(tagId: number): string {
  const tag = getTagByID(tagId);
  if (!tag) return 'Matches your preferences';
  const name = capitalize(tag.name);
  if (tagId >= 400) {
    const article = /^[aeiou]/i.test(tag.name) ? 'an' : 'a';
    return `Because you own ${article} ${name}`;
  }
  if (tagId >= 300) return `Because you love ${name} food`;
  if (tagId >= 100) return `Because you prefer ${name} recipes`;
  return `Because you like ${name} recipes`;
}

export default function getReasonText(item: RecommendationRow): string {
  if (item.dominant_signal === 'taste' && item.nearest_recipe) {
    const nr = item.nearest_recipe;
    if (nr.set === 'own') return `Because you created ${nr.title}`;
    if (nr.set === 'ratings') return `Because you loved ${nr.title}`;
    if (nr.title.startsWith('hidden:')) {
      const foodTitle = nr.title.split(':')[1];
      return `Because you like ${capitalize(foodTitle)}`;
    }
    return `Because you saved ${nr.title}`;
  }
  if (item.dominant_signal === 'tags' && item.matched_tags?.length) {
    const sorted = [...item.matched_tags]
      .map((id) => getTagByID(id))
      .filter(Boolean)
      .sort((a, b) => (b!.value ?? 0) - (a!.value ?? 0));
    const topTag = sorted[0];
    return topTag ? tagReasonText(topTag.id) : 'Matches your preferences';
  }
  return 'Trending';
}
