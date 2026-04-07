// Weighted-average embedding + cosine-similarity helpers for the
// "Taste Neighbors" feature. Recipe embeddings are 256-dim pgvectors;
// supabase-js returns them as strings like "[0.1,0.2,...]".

export const EMBEDDING_DIMS = 256;

export function parseVector(raw: unknown): number[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const arr = raw.map(Number);
    return arr.every((n) => Number.isFinite(n)) ? arr : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.replace(/^\[|\]$/g, '').trim();
    if (!trimmed) return null;
    const arr = trimmed.split(',').map((s) => Number(s.trim()));
    return arr.every((n) => Number.isFinite(n)) ? arr : null;
  }
  return null;
}

export function serializeVector(v: number[]): string {
  return `[${v.join(',')}]`;
}

/**
 * Weighted average of embeddings. Items missing a vector are skipped.
 * Returns null if no valid vectors contributed.
 */
export function weightedAverageEmbedding(
  items: { vec: number[] | null; weight: number }[],
  dims = EMBEDDING_DIMS,
): number[] | null {
  const sum = new Array(dims).fill(0);
  let total = 0;
  for (const { vec, weight } of items) {
    if (!vec || vec.length !== dims) continue;
    for (let i = 0; i < dims; i++) sum[i] += vec[i] * weight;
    total += weight;
  }
  if (total === 0) return null;
  for (let i = 0; i < dims; i++) sum[i] /= total;
  return sum;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
