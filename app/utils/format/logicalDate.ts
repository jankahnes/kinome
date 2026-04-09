export function formatLogicalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLogicalDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearPart, monthPart, dayPart] = value.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function todayLogicalDate() {
  return formatLogicalDate(new Date());
}

export function isSameLogicalDate(a: Date, b: Date) {
  return formatLogicalDate(a) === formatLogicalDate(b);
}
