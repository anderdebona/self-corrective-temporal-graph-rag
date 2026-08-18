# Self-Corrective Temporal GraphRAG Engine 🧠 ⏳

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/Version-v5.0.0%20Ultra-00d2ff?style=for-the-badge)](https://github.com/anderdebona/self-corrective-temporal-graph-rag)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Passing%20100%25-success?style=for-the-badge&logo=githubactions)](https://github.com/anderdebona/self-corrective-temporal-graph-rag/actions)

<br />

**PhD-Grade Self-Corrective Temporal GraphRAG: Corrective RAG (CRAG) Temporal Evaluators, Time-Decayed PageRank Random Walks, Monotonic Causal Paths & Platt Scaling**

*Engineered with precision by **[anderdebona](https://github.com/anderdebona)***

</div>

---

## 📌 Executive Summary & Architecture

This repository delivers a **Self-Corrective Temporal Graph Retrieval-Augmented Generation (GraphRAG)** architecture. It solves temporal hallucination and knowledge obsolescence by verifying episodic valid-time intervals $[t_{\text{start}}, t_{\text{end}}]$, computing continuous time-decayed PageRank random walks, executing multi-stage Corrective RAG (CRAG) routing, and discovering monotonic time-respecting causal reasoning paths.

---

## 🔬 Mathematical Formulations

### 1. Corrective RAG (CRAG) Temporal Filtering & Routing
$$\text{Action}(q, t) = \begin{cases} \text{CORRECT} & \text{if } \text{Score}(d, t) \ge \tau_{\text{high}} \\ \text{AMBIGUOUS\_REWRITE} & \text{if } \tau_{\text{low}} \le \text{Score}(d, t) < \tau_{\text{high}} \\ \text{INCORRECT\_FALLBACK} & \text{if } \text{Score}(d, t) < \tau_{\text{low}} \end{cases}$$

### 2. Time-Decayed Continuous PageRank
$$P_{ij}(t) = \frac{\exp(-\lambda (t - t_{ij}))}{\sum_{k \in \mathcal{N}(i)} \exp(-\lambda (t - t_{ik}))}$$
$$PR_i(t) = \frac{1 - d}{N} + d \sum_{j \in \text{In}(i)} PR_j(t) P_{ji}(t)$$

---

## ⚡ What's New in v5.0.0

- 🛡️ **`TemporalCRAGEvaluator`**: Dynamic temporal document filtering, query refinement, and external search fallback triggering.
- 📈 **`TimeDecayedPageRankEngine`**: Continuous random walk ranking biased toward recency with exponential half-life decay.
- 🎛️ **Studio v5.0.0**: Interactive Continuous Time-Slider, live CRAG routing metrics, and dynamic PageRank table.
- 🧪 **15/15 Tests Passing**: 100% Vitest coverage across interval compression, monotonic paths, and Platt calibrations.

---

## 🚀 Quickstart & Interactive Studio

```bash
git clone https://github.com/anderdebona/self-corrective-temporal-graph-rag.git
cd self-corrective-temporal-graph-rag
npm install
npm test
npm run build
npm start
# Open http://localhost:3007
```

---

## 📄 License & Citation
MIT License © 2026 anderdebona. See [CITATION.cff](CITATION.cff) for academic attribution.
