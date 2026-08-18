export type CRAGAction = 'CORRECT' | 'AMBIGUOUS_REWRITE' | 'INCORRECT_FALLBACK';

export interface TemporalDocument {
  id: string;
  content: string;
  validFrom: number; // timestamp
  validTo: number;   // timestamp
  confidence: number;
}

export interface CRAGEvaluationResult {
  action: CRAGAction;
  overallRelevanceScore: number;
  temporalConsistency: boolean;
  retainedDocuments: TemporalDocument[];
  filteredStaleDocuments: TemporalDocument[];
  suggestedRewrittenQuery?: string;
  fallbackTriggered: boolean;
}

export class TemporalCRAGEvaluator {
  private highThreshold: number = 0.70;
  private lowThreshold: number = 0.35;

  /**
   * Evaluates retrieved temporal documents and determines corrective action
   */
  public evaluate(
    query: string,
    queryTimestamp: number,
    documents: TemporalDocument[]
  ): CRAGEvaluationResult {
    const retained: TemporalDocument[] = [];
    const stale: TemporalDocument[] = [];

    let totalScore = 0;

    for (const doc of documents) {
      // Check temporal validity interval [validFrom, validTo]
      const isTemporallyValid = queryTimestamp >= doc.validFrom && queryTimestamp <= doc.validTo;

      if (!isTemporallyValid) {
        stale.push(doc);
        continue;
      }

      // Semantic keyword match approximation
      const queryTerms = query.toLowerCase().split(/\s+/);
      const matchCount = queryTerms.filter(term => doc.content.toLowerCase().includes(term)).length;
      const semanticScore = matchCount / Math.max(1, queryTerms.length);

      const docScore = 0.6 * semanticScore + 0.4 * doc.confidence;
      totalScore += docScore;
      retained.push(doc);
    }

    const avgScore = retained.length > 0 ? totalScore / retained.length : 0;
    const normalizedScore = Math.round(avgScore * 100) / 100;

    let action: CRAGAction = 'CORRECT';
    let suggestedQuery: string | undefined;
    let fallback = false;

    if (normalizedScore >= this.highThreshold) {
      action = 'CORRECT';
    } else if (normalizedScore >= this.lowThreshold) {
      action = 'AMBIGUOUS_REWRITE';
      suggestedQuery = `${query} [as of timestamp ${queryTimestamp}]`;
    } else {
      action = 'INCORRECT_FALLBACK';
      fallback = true;
    }

    return {
      action,
      overallRelevanceScore: normalizedScore,
      temporalConsistency: stale.length === 0,
      retainedDocuments: retained,
      filteredStaleDocuments: stale,
      suggestedRewrittenQuery: suggestedQuery,
      fallbackTriggered: fallback
    };
  }
}
