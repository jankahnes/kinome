export default function getHealthLabel(
  grade: string | null | undefined,
): string {
  const base = grade?.[0] ?? '';
  switch (base) {
    case 'S':
      return 'Outstanding';
    case 'A':
      return 'Excellent';
    case 'B':
      return 'Healthy';
    case 'C':
      return 'Balanced';
    case 'D':
      return 'Occasional';
    case 'E':
      return 'Indulgent';
    case 'F':
      return 'Indulgent';
    default:
      return '';
  }
}
