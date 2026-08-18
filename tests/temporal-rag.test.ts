import { describe, it, expect } from 'vitest';
import { TemporalKnowledgeGraph } from '../src/graph/temporal-graph.js';
import { SpeculativeRAGEvaluator } from '../src/rag/evaluator.js';
import { ConfidenceCalibrator } from '../src/rag/confidence-calibrator.js';
import { TemporalDecayEngine } from '../src/graph/temporal-decay.js';

describe('Temporal Knowledge Graph', () => {
  it('should add and retrieve temporal facts', () => {
    const kg = new TemporalKnowledgeGraph();
    kg.addTemporalFact('n1', 'TaxRate', 'Rate is 10%', 2020, 2023);
    const facts = kg.queryTemporal('TaxRate', 2021);
    expect(facts.length).toBe(1);
  });
});

describe('Speculative RAG Evaluator', () => {
  it('should retrieve relevant facts for a target year', () => {
    const kg = new TemporalKnowledgeGraph();
    kg.addTemporalFact('n1', 'TaxRate', 'Old rate', 2020, 2023);
    kg.addTemporalFact('n2', 'TaxRate', 'New rate', 2024, 2030);
    const evaluator = new SpeculativeRAGEvaluator(kg);
    const result = evaluator.evaluateAndRetrieve('Tax?', 'TaxRate', 2025);
    expect(result.retrievedNodes.length).toBe(1);
  });
});

describe('Confidence Calibrator', () => {
  it('should calibrate raw confidence scores via Platt scaling', () => {
    const calibrator = new ConfidenceCalibrator();
    const result = calibrator.evaluateConfidence(0.9);
    expect(result.calibratedConfidence).toBeGreaterThan(0);
    expect(result.calibratedConfidence).toBeLessThanOrEqual(1);
  });

  it('should compute Expected Calibration Error (ECE)', () => {
    const calibrator = new ConfidenceCalibrator();
    const predictions = [
      { confidence: 0.9, correct: true },
      { confidence: 0.8, correct: true },
      { confidence: 0.3, correct: false },
      { confidence: 0.1, correct: false },
    ];
    const ece = calibrator.computeECE(predictions);
    expect(ece).toBeGreaterThanOrEqual(0);
    expect(ece).toBeLessThanOrEqual(1);
  });

  it('should mark low-confidence predictions as unreliable', () => {
    const calibrator = new ConfidenceCalibrator(-5, 3);
    const result = calibrator.evaluateConfidence(0.1);
    expect(result.isReliable).toBe(false);
  });
});

describe('Temporal Decay Engine', () => {
  it('should apply exponential decay to old facts', () => {
    const engine = new TemporalDecayEngine(3);
    const result = engine.applyDecay('fact-1', 1.0, 2020, 2026);
    expect(result.decayedRelevance).toBeLessThan(1.0);
    expect(result.ageYears).toBe(6);
  });

  it('should not decay recent facts significantly', () => {
    const engine = new TemporalDecayEngine(5);
    const result = engine.applyDecay('fact-1', 1.0, 2025, 2026);
    expect(result.decayedRelevance).toBeGreaterThan(0.8);
  });

  it('should filter expired facts and rank by relevance', () => {
    const engine = new TemporalDecayEngine(2, 0.1);
    const facts = [
      { id: 'old', relevance: 1.0, year: 2010 },
      { id: 'recent', relevance: 1.0, year: 2025 },
      { id: 'mid', relevance: 1.0, year: 2022 },
    ];
    const ranked = engine.filterAndRank(facts, 2026);
    expect(ranked[0].factId).toBe('recent');
    expect(ranked.some((r) => r.factId === 'old')).toBe(false);
  });
});

import { QueryRewriter } from '../src/rag/query-rewriter.js';
import { HierarchicalRetriever } from '../src/rag/hierarchical-retriever.js';

describe('Query Rewriter', () => {
  it('should expand synonyms in queries', () => {
    const rw = new QueryRewriter();
    const result = rw.rewrite('tax rate');
    expect(result.expansions.length).toBeGreaterThan(0);
    expect(result.strategy).toBe('SYNONYM_EXPANSION');
  });
  it('should passthrough unknown terms', () => {
    const rw = new QueryRewriter();
    const result = rw.rewrite('quantum computing');
    expect(result.strategy).toBe('PASSTHROUGH');
  });
});

describe('Hierarchical Retriever', () => {
  it('should retrieve from multiple levels', () => {
    const hr = new HierarchicalRetriever();
    hr.addLevel('summary', ['Tax rate overview 2024', 'Economic summary']);
    hr.addLevel('detail', ['Tax rate is 15% for individuals', 'Corporate tax details']);
    const results = hr.retrieve('tax');
    expect(results.length).toBe(2);
    expect(results[0].totalRetrieved).toBeGreaterThan(0);
  });
});

describe('TemporalGraphCompressor (v4.0.0)', () => {
  it('should merge contiguous temporal facts into unified intervals', async () => {
    const { TemporalGraphCompressor } = await import('../src/graph/temporal-compressor.js');
    const facts = [
      { id: 'f1', entity: 'CEO', property: 'role', value: 'Alice', validFrom: 2020, validTo: 2022 },
      { id: 'f2', entity: 'CEO', property: 'role', value: 'Alice', validFrom: 2023, validTo: 2025 },
      { id: 'f3', entity: 'CEO', property: 'role', value: 'Bob', validFrom: 2026, validTo: 2028 },
    ];
    const compressed = TemporalGraphCompressor.compress(facts);
    expect(compressed.length).toBe(2);
    const aliceInterval = compressed.find(c => c.value === 'Alice')!;
    expect(aliceInterval.validFrom).toBe(2020);
    expect(aliceInterval.validTo).toBe(2025);
    expect(aliceInterval.mergedFactCount).toBe(2);
  });
});

describe('BiDirectionalTemporalPathFinder (v4.0.0)', () => {
  it('should find time-respecting monotonic paths', async () => {
    const { BiDirectionalTemporalPathFinder } = await import('../src/graph/bidirectional-pathfinder.js');
    const edges = [
      { from: 'NodeA', to: 'NodeB', timestamp: 100, relation: 'causes' },
      { from: 'NodeB', to: 'NodeC', timestamp: 200, relation: 'triggers' },
      { from: 'NodeA', to: 'NodeC', timestamp: 50, relation: 'bypasses' }, // past event
    ];
    const result = BiDirectionalTemporalPathFinder.findMonotonicPath(edges, 'NodeA', 'NodeC', 80, 300);
    expect(result.found).toBe(true);
    expect(result.path).toEqual(['NodeA', 'NodeB', 'NodeC']);
    expect(result.totalTimeSpan).toBe(100);
  });
});

describe('TemporalCRAGEvaluator (v5.0.0)', () => {
  it('should filter stale temporal documents and trigger corrective action', async () => {
    const { TemporalCRAGEvaluator } = await import('../src/rag/temporal-crag-evaluator.js');
    const evaluator = new TemporalCRAGEvaluator();

    const docs = [
      { id: 'd1', content: 'Interest rate set at 5.25% by Federal Reserve', validFrom: 2023, validTo: 2024, confidence: 0.95 },
      { id: 'd2', content: 'Historic Interest rate zero lower bound policy', validFrom: 2010, validTo: 2015, confidence: 0.90 }
    ];

    // Query in year 2024
    const result = evaluator.evaluate('Interest rate Federal Reserve', 2024, docs);
    expect(result.action).toBe('CORRECT');
    expect(result.retainedDocuments.length).toBe(1);
    expect(result.retainedDocuments[0].id).toBe('d1');
    expect(result.filteredStaleDocuments.length).toBe(1);
    expect(result.filteredStaleDocuments[0].id).toBe('d2');
  });
});

describe('TimeDecayedPageRankEngine (v5.0.0)', () => {
  it('should rank recent nodes higher than stale historical nodes in temporal random walk', async () => {
    const { TimeDecayedPageRankEngine } = await import('../src/graph/time-decay-pagerank.js');
    const engine = new TimeDecayedPageRankEngine(0.01, 0.85);

    const now = Date.now();
    const nodes = ['Hub', 'RecentNode', 'OldNode'];
    const edges = [
      { source: 'Hub', target: 'RecentNode', timestamp: now - 1000 },
      { source: 'Hub', target: 'OldNode', timestamp: now - 100000000 },
    ];

    const result = engine.computeTemporalPageRank(nodes, edges, now);
    expect(result.scores['RecentNode']).toBeGreaterThan(result.scores['OldNode']);
    expect(result.converged).toBe(true);
  });
});


