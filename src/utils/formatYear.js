export function formatYear(year) {
  return year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`;
}
