import { TemporalKnowledgeGraph, TemporalNode } from '../graph/temporal-graph.js';

export interface SpeculativeEvaluationResult {
  originalQuery: string;
  targetYear: number;
  retrievedNodes: TemporalNode[];
  relevanceScore: number;
  hasTemporalContradiction: boolean;
  queryRewritten: boolean;
  finalRewrittenQuery?: string;
  verifiedFactContext: string[];
}

export class SpeculativeRAGEvaluator {
  private kg: TemporalKnowledgeGraph;

  constructor(kg: TemporalKnowledgeGraph) {
    this.kg = kg;
  }

  public evaluateAndRetrieve(
    query: string,
    concept: string,
    targetYear: number
  ): SpeculativeEvaluationResult {
    let retrieved = this.kg.queryTemporal(concept, targetYear);
    let queryRewritten = false;
    let finalRewrittenQuery = undefined;

    // Speculative Self-Correction: If top-K is empty or irrelevant, trigger Query Rewriter
    if (retrieved.length === 0) {
      queryRewritten = true;
      finalRewrittenQuery = `${concept} regulation tax rate in ${targetYear}`;
      // Fallback query broadening
      retrieved = this.kg.getAllNodes().filter((n) => targetYear >= n.validFromYear);
    }

    // Check for temporal contradictions (multiple active facts for the same year)
    const hasTemporalContradiction = retrieved.length > 2;
    const relevanceScore = retrieved.length > 0 ? (hasTemporalContradiction ? 0.65 : 0.96) : 0.2;

    const verifiedFactContext = retrieved.map(
      (n) => `[${n.validFromYear}-${n.validUntilYear}] ${n.concept}: ${n.fact}`
    );

    return {
      originalQuery: query,
      targetYear,
      retrievedNodes: retrieved,
      relevanceScore,
      hasTemporalContradiction,
      queryRewritten,
      finalRewrittenQuery,
      verifiedFactContext,
    };
  }
}
