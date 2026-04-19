export default function getTotalTime(
  total: number | null,
  effort: string | null,
) {
  if (total) {
    let rounded;

    if (total < 60) {
      rounded = Math.floor(total / 5) * 5;
    } else if (total < 120) {
      rounded = Math.floor(total / 10) * 10;
    } else {
      rounded = Math.floor(total / 30) * 30;
    }

    rounded = Math.max(5, rounded);

    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}min`;
  }

  if (effort === 'LIGHT') {
    return '<20min';
  }
  if (effort === 'MODERATE') {
    return '35min';
  }
  if (effort === 'HEAVY') {
    return '>60min';
  }

  return null;
}
