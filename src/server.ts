import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { TemporalKnowledgeGraph } from './graph/temporal-graph.js';
import { SpeculativeRAGEvaluator } from './rag/evaluator.js';
import { TemporalRAGGenerator } from './llm/generator.js';
import { TemporalGraphCompressor, TemporalIntervalFact } from './graph/temporal-compressor.js';
import { BiDirectionalTemporalPathFinder, TemporalEdge } from './graph/bidirectional-pathfinder.js';
import { ConfidenceCalibrator } from './rag/confidence-calibrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const kg = new TemporalKnowledgeGraph();
kg.addTemporalFact('n1', 'TaxRate', 'Standard NFe import tax rate set to 10%', 2020, 2023);
kg.addTemporalFact('n2', 'TaxRate', 'Updated NFe import tax rate set to 15% under reform', 2024, 2030);
kg.addTemporalFact('n3', 'ComplianceRule', 'Mandatory digital signature for invoices', 2022, 2030);
kg.addTemporalFact('n4', 'CEO', 'Alice appointed Chief Executive Officer', 2020, 2024);
kg.addTemporalFact('n5', 'CEO', 'Bob appointed Chief Executive Officer', 2025, 2030);

const evaluator = new SpeculativeRAGEvaluator(kg);
const calibrator = new ConfidenceCalibrator();

const temporalEdges: TemporalEdge[] = [
  { from: 'TaxReform_2020', to: 'TaxRate_10', timestamp: 2020, relation: 'enacted' },
  { from: 'TaxRate_10', to: 'Compliance_2022', timestamp: 2022, relation: 'amended_by' },
  { from: 'Compliance_2022', to: 'TaxRate_15', timestamp: 2024, relation: 'superseded_by' },
  { from: 'TaxRate_15', to: 'AI_Audit_2026', timestamp: 2026, relation: 'governed_by' },
];

app.get('/api/nodes', (req, res) => {
  res.json(kg.getAllNodes());
});

app.post('/api/rag/query', (req, res) => {
  const { concept = 'TaxRate', targetYear = 2026 } = req.body;
  const evaluation = evaluator.evaluateAndRetrieve(`What is the ${concept} in ${targetYear}?`, concept, targetYear);
  const generation = TemporalRAGGenerator.generateResponse(evaluation);
  const rawConfidence = evaluation.relevanceScore;
  const calibrated = calibrator.evaluateConfidence(rawConfidence);

  res.json({
    evaluation,
    generation,
    calibrated,
  });
});

app.post('/api/rag/compress', (req, res) => {
  const allFacts: TemporalIntervalFact[] = kg.getAllNodes().map(n => ({
    id: n.id,
    entity: n.concept,
    property: 'state',
    value: n.fact,
    validFrom: n.validFromYear,
    validTo: n.validUntilYear,
  }));
  const compressed = TemporalGraphCompressor.compress(allFacts);
  res.json({ originalCount: allFacts.length, compressedCount: compressed.length, compressed });
});

app.post('/api/rag/path', (req, res) => {
  const { startNode = 'TaxReform_2020', goalNode = 'AI_Audit_2026', minYear = 2020, maxYear = 2030 } = req.body;
  const pathResult = BiDirectionalTemporalPathFinder.findMonotonicPath(
    temporalEdges,
    startNode,
    goalNode,
    minYear,
    maxYear
  );
  res.json({ pathResult, edges: temporalEdges });
});

app.listen(PORT, () => {
  console.log(`🚀 Self-Corrective Temporal GraphRAG Turbocharged on http://localhost:${PORT}`);
});
