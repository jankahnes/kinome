export default function normalizeTags(tags: any[]): number[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => (typeof t === 'number' ? t : (t?.tag_id ?? t)))
    .filter(Number.isFinite);
}
