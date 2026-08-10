/**
 * Temporal decay result for a knowledge fact
 */
export interface TemporalDecayResult {
  factId: string;
  originalRelevance: number;
  decayedRelevance: number;
  ageYears: number;
  halfLifeYears: number;
  isExpired: boolean;
}

/**
 * Temporal Decay Engine — Applies exponential decay functions to penalize
 * stale facts in a temporal knowledge graph.
 *
 * Decay Model:
 * ```
 *   R(t) = R₀ * exp(-λt)
 *   where λ = ln(2) / t_half  (half-life decay constant)
 * ```
 *
 * Use cases:
 * - Regulatory facts (tax rates) become obsolete after reforms
 * - Technology references become stale after new versions
 * - Market data loses relevance over time
 *
 * Reference: Recency-weighted retrieval in temporal KGs
 */
export class TemporalDecayEngine {
  private halfLifeYears: number;
  private lambda: number;
  private expirationThreshold: number;

  constructor(halfLifeYears: number = 3, expirationThreshold: number = 0.1) {
    this.halfLifeYears = halfLifeYears;
    this.lambda = Math.LN2 / halfLifeYears;
    this.expirationThreshold = expirationThreshold;
  }

  /**
   * Computes the decay factor for a fact of a given age.
   */
  public computeDecay(ageYears: number): number {
    return Math.exp(-this.lambda * ageYears);
  }

  /**
   * Applies temporal decay to a fact's relevance score.
   */
  public applyDecay(
    factId: string,
    originalRelevance: number,
    factYear: number,
    currentYear: number
  ): TemporalDecayResult {
    const ageYears = Math.max(0, currentYear - factYear);
    const decayFactor = this.computeDecay(ageYears);
    const decayedRelevance = originalRelevance * decayFactor;

    return {
      factId,
      originalRelevance,
      decayedRelevance,
      ageYears,
      halfLifeYears: this.halfLifeYears,
      isExpired: decayedRelevance < this.expirationThreshold,
    };
  }

  /**
   * Batch-processes multiple facts and returns only non-expired ones,
   * sorted by decayed relevance descending.
   */
  public filterAndRank(
    facts: Array<{ id: string; relevance: number; year: number }>,
    currentYear: number
  ): TemporalDecayResult[] {
    return facts
      .map((f) => this.applyDecay(f.id, f.relevance, f.year, currentYear))
      .filter((r) => !r.isExpired)
      .sort((a, b) => b.decayedRelevance - a.decayedRelevance);
  }
}
