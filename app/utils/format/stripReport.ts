export function stripReport<T>(food: T): T {
  if (!food) return food;
  const { report: _r, fullReport: _fr, full_report: _frs, ...rest } = food as any;
  return rest as T;
}
