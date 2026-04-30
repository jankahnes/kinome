export default function stripIngredientLinks(input: string): string {
  if (!input) return '';
  return input
    .replace(/\[([^\]]+)\]\(\d+\)/g, (_, ingredient) => ingredient)
    .replace(/\*([^*]+)\*/g, '$1');
}
