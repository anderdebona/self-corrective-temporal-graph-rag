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
