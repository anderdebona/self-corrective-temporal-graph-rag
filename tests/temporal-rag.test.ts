import { describe, it, expect } from 'vitest';
import { TemporalKnowledgeGraph } from '../src/graph/temporal-graph.js';
import { SpeculativeRAGEvaluator } from '../src/rag/evaluator.js';
import { TemporalRAGGenerator } from '../src/llm/generator.js';

describe('Self-Corrective Temporal GraphRAG Tests', () => {
  it('should isolate temporal context and retrieve correct fact for target year', () => {
    const kg = new TemporalKnowledgeGraph();
    kg.addTemporalFact('f1', 'TaxRate', '10%', 2020, 2023);
    kg.addTemporalFact('f2', 'TaxRate', '15%', 2024, 2030);

    const fact2022 = kg.queryTemporal('TaxRate', 2022);
    expect(fact2022.length).toBe(1);
    expect(fact2022[0].fact).toBe('10%');

    const fact2026 = kg.queryTemporal('TaxRate', 2026);
    expect(fact2026.length).toBe(1);
    expect(fact2026[0].fact).toBe('15%');
  });

  it('should trigger speculative query re-writer when context is missing', () => {
    const kg = new TemporalKnowledgeGraph();
    const evaluator = new SpeculativeRAGEvaluator(kg);

    const evalResult = evaluator.evaluateAndRetrieve('Query', 'NonExistentConcept', 2026);
    expect(evalResult.queryRewritten).toBe(true);

    const response = TemporalRAGGenerator.generateResponse(evalResult);
    expect(response.relevanceConfidence).toBeLessThan(0.5);
  });
});
