import { SpeculativeEvaluationResult } from '../rag/evaluator.js';

export interface RAGSynthesisOutput {
  query: string;
  targetYear: number;
  synthesizedAnswer: string;
  temporalAuditingCitations: string[];
  relevanceConfidence: number;
}

export class TemporalRAGGenerator {
  public static generateResponse(evalResult: SpeculativeEvaluationResult): RAGSynthesisOutput {
    const citations = evalResult.verifiedFactContext;

    let answer = '';
    if (evalResult.verifiedFactContext.length > 0) {
      answer = `Based on temporal graph verification for year ${evalResult.targetYear}: ${evalResult.verifiedFactContext.join(' ')}`;
    } else {
      answer = `No valid temporal facts found for year ${evalResult.targetYear}. Context filtered to prevent hallucination.`;
    }

    return {
      query: evalResult.originalQuery,
      targetYear: evalResult.targetYear,
      synthesizedAnswer: answer,
      temporalAuditingCitations: citations,
      relevanceConfidence: evalResult.relevanceScore,
    };
  }
}
