import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { TemporalKnowledgeGraph } from './graph/temporal-graph.js';
import { SpeculativeRAGEvaluator } from './rag/evaluator.js';
import { TemporalRAGGenerator } from './llm/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Seed Temporal Knowledge Graph with evolving facts over time
const kg = new TemporalKnowledgeGraph();
kg.addTemporalFact('n1', 'TaxRate', 'Standard NFe import tax rate set to 10%', 2020, 2023);
kg.addTemporalFact('n2', 'TaxRate', 'Updated NFe import tax rate set to 15% under reform', 2024, 2030);
kg.addTemporalFact('n3', 'ComplianceRule', 'Mandatory digital signature for invoices', 2022, 2030);

const evaluator = new SpeculativeRAGEvaluator(kg);

app.get('/api/nodes', (req, res) => {
  res.json(kg.getAllNodes());
});

app.post('/api/rag/query', (req, res) => {
  const { concept = 'TaxRate', targetYear = 2026 } = req.body;
  const evaluation = evaluator.evaluateAndRetrieve(`What is the ${concept} in ${targetYear}?`, concept, targetYear);
  const generation = TemporalRAGGenerator.generateResponse(evaluation);

  res.json({
    evaluation,
    generation,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Self-Corrective Temporal GraphRAG running on http://localhost:${PORT}`);
});
