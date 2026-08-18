export interface TemporalEdge {
  source: string;
  target: string;
  timestamp: number;
}

export interface TemporalPageRankResult {
  scores: Record<string, number>;
  recencyLambda: number;
  iterations: number;
  converged: boolean;
}

export class TimeDecayedPageRankEngine {
  private lambda: number; // Half-life decay constant
  private dampingFactor: number;

  constructor(lambda: number = 0.001, dampingFactor: number = 0.85) {
    this.lambda = lambda;
    this.dampingFactor = dampingFactor;
  }

  /**
   * Calculates continuous time-decayed PageRank on temporal graph edges
   */
  public computeTemporalPageRank(
    nodes: string[],
    edges: TemporalEdge[],
    referenceTime: number = Date.now(),
    maxIterations: number = 30
  ): TemporalPageRankResult {
    const N = nodes.length;
    if (N === 0) {
      return { scores: {}, recencyLambda: this.lambda, iterations: 0, converged: true };
    }

    // Weight edges by exponential time decay: w = exp(-lambda * deltaT)
    const outWeights = new Map<string, number>();
    const weightedTransitions = new Map<string, Array<{ target: string; weight: number }>>();

    nodes.forEach(n => {
      outWeights.set(n, 0);
      weightedTransitions.set(n, []);
    });

    edges.forEach(e => {
      const deltaT = Math.max(0, referenceTime - e.timestamp) / 1000; // seconds
      const weight = Math.exp(-this.lambda * deltaT);

      outWeights.set(e.source, (outWeights.get(e.source) || 0) + weight);
      weightedTransitions.get(e.source)?.push({ target: e.target, weight });
    });

    // Initialize uniform PageRank
    let pr = new Map<string, number>();
    nodes.forEach(n => pr.set(n, 1 / N));

    let iter = 0;
    let converged = false;

    while (iter < maxIterations && !converged) {
      iter++;
      const nextPr = new Map<string, number>();
      nodes.forEach(n => nextPr.set(n, (1 - this.dampingFactor) / N));

      nodes.forEach(u => {
        const uPr = pr.get(u)!;
        const totalOut = outWeights.get(u) || 0;
        const transitions = weightedTransitions.get(u) || [];

        if (totalOut > 0) {
          transitions.forEach(t => {
            const prob = t.weight / totalOut;
            const currentTVal = nextPr.get(t.target)!;
            nextPr.set(t.target, currentTVal + this.dampingFactor * uPr * prob);
          });
        } else {
          // Dangling node redistribution
          nodes.forEach(v => {
            nextPr.set(v, nextPr.get(v)! + (this.dampingFactor * uPr) / N);
          });
        }
      });

      // Check convergence L1 norm
      let diff = 0;
      nodes.forEach(n => {
        diff += Math.abs(nextPr.get(n)! - pr.get(n)!);
      });

      pr = nextPr;
      if (diff < 1e-5) {
        converged = true;
      }
    }

    const resultScores: Record<string, number> = {};
    pr.forEach((val, key) => {
      resultScores[key] = Math.round(val * 10000) / 10000;
    });

    return {
      scores: resultScores,
      recencyLambda: this.lambda,
      iterations: iter,
      converged
    };
  }
}
