
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function getFoodUrl(id: number | string, name: string): string {
  const slug = slugify(name);
  return `/foods/${id}-${slug}`;
}

export function getRecipeUrl(id: number | string, title: string): string {
  const slug = slugify(title);
  return `/recipe/${id}-${slug}`;
}
