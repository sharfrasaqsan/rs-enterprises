/**
 * Client-side localStorage utility for vehicle comparison.
 * Keeps public JS minimal with zero database reads.
 */

const STORAGE_KEY = "rs_compare_vehicles";
const MAX_COMPARE = 3;

export function getCompareSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function addCompareSlug(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getCompareSlugs();
    if (current.includes(slug)) return true;
    if (current.length >= MAX_COMPARE) {
      alert(`You can compare up to ${MAX_COMPARE} vehicles at a time.`);
      return false;
    }
    const updated = [...current, slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("rs_compare_updated", { detail: updated }));
    return true;
  } catch {
    return false;
  }
}

export function removeCompareSlug(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getCompareSlugs();
    const updated = current.filter((s) => s !== slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("rs_compare_updated", { detail: updated }));
  } catch {
    // Ignore
  }
}

export function toggleCompareSlug(slug: string): boolean {
  const current = getCompareSlugs();
  if (current.includes(slug)) {
    removeCompareSlug(slug);
    return false;
  }
  return addCompareSlug(slug);
}

