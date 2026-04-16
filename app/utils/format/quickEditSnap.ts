export function getSnapStep(amount: number, unit: string): {step: number, pxPerStep: number} {
  const u = unit?.toUpperCase?.() ?? '';
  if (u === 'G' || u === 'ML') {
    if (amount >= 200) return {step: 20, pxPerStep: 28};
    if (amount >= 100) return {step: 10, pxPerStep: 28};
    if (amount >= 20) return {step: 5, pxPerStep: 20};
    return {step: 1, pxPerStep: 20};
  }
  if (u === 'KG' || u === 'L') return {step: 0.1, pxPerStep: 28};
  if (u === 'TBSP' || u === 'TSP') return {step: 0.5, pxPerStep: 60};
  if (u === 'CUP') return {step: 0.25, pxPerStep: 60};
  if (u === 'OZ') return {step: 1, pxPerStep: 28};
  if (u === 'LB') return {step: 0.25, pxPerStep: 28};
  return {step: 0.25, pxPerStep: 15};
}


export function snapAmount(amount: number, unit: string): number {
  const {step} = getSnapStep(amount, unit);
  const snapped = Math.round(amount / step) * step;
  const decimals = step < 1 ? 2 : 0;
  return Number(snapped.toFixed(decimals));
}

export function computeDraggedAmount(
  startAmount: number,
  unit: string,
  deltaPx: number,
): number {
  const {step, pxPerStep} = getSnapStep(startAmount, unit);
  const rawSteps = deltaPx / pxPerStep;
  const next = startAmount + rawSteps * step;
  return snapAmount(Math.max(0, next), unit);
}
