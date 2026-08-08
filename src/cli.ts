#!/usr/bin/env node
import { TemporalKnowledgeGraph } from './graph/temporal-graph.js';
import { SpeculativeRAGEvaluator } from './rag/evaluator.js';
import { TemporalRAGGenerator } from './llm/generator.js';

console.log(`
===========================================================
  🧠 SELF-CORRECTIVE TEMPORAL GRAPHRAG CLI [v1.0.0]
  Author: anderdebona
===========================================================
`);

const kg = new TemporalKnowledgeGraph();
kg.addTemporalFact('n1', 'TaxRate', 'Standard NFe import tax rate set to 10%', 2020, 2023);
kg.addTemporalFact('n2', 'TaxRate', 'Updated NFe import tax rate set to 15% under reform', 2024, 2030);

const evaluator = new SpeculativeRAGEvaluator(kg);

console.log('🔍 Querying Temporal RAG for target year 2026...');
const eval2026 = evaluator.evaluateAndRetrieve('What is the TaxRate in 2026?', 'TaxRate', 2026);
const res2026 = TemporalRAGGenerator.generateResponse(eval2026);

console.log('\n📊 Synthesized Output [2026]:');
console.log(JSON.stringify(res2026, null, 2));
