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
      return [
        { label: hours > 1 ? 'hrs' : 'hr', value: hours },
        { label: 'min', value: minutes },
      ];
    }
    if (hours > 0) {
      return [{ label: hours > 1 ? 'hrs' : 'hr', value: hours }];
    }
    return [{ label: 'min', value: minutes }];
  }

  if (effort === 'LIGHT') {
    return [{ label: 'min', value: '<20' }];
  }
  if (effort === 'MODERATE') {
    return [{ label: 'min', value: '35' }];
  }
  if (effort === 'HEAVY') {
    return [{ label: 'min', value: '>60' }];
  }

  return null;
}
