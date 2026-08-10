/**
 * Calibration result for RAG confidence scores
 */
export interface CalibrationResult {
  originalConfidence: number;
  calibratedConfidence: number;
  expectedCalibrationError: number;
  isReliable: boolean;
}

/**
 * Confidence Calibrator — Adjusts RAG retrieval confidence scores using
 * Platt Scaling to align predicted probabilities with observed accuracy.
 *
 * Uncalibrated models often produce overconfident predictions. Platt scaling
 * fits a sigmoid: P(correct | score) = 1 / (1 + exp(A*s + B))
 *
 * Expected Calibration Error (ECE):
 * ```
 *   ECE = Σ_b (|B_b|/N) * |acc(B_b) - conf(B_b)|
 * ```
 *
 * Reference: Platt, "Probabilistic Outputs for SVMs" (1999)
 *            Guo et al., "On Calibration of Modern Neural Networks" (ICML 2017)
 */
export class ConfidenceCalibrator {
  private plattA: number;
  private plattB: number;

  constructor(plattA: number = -1.5, plattB: number = 0.2) {
    this.plattA = plattA;
    this.plattB = plattB;
  }

  /**
   * Applies Platt scaling sigmoid to a raw confidence score.
   */
  public calibrate(rawConfidence: number): number {
    return 1 / (1 + Math.exp(this.plattA * rawConfidence + this.plattB));
  }

  /**
   * Computes Expected Calibration Error (ECE) over a set of predictions.
   */
  public computeECE(
    predictions: Array<{ confidence: number; correct: boolean }>,
    numBins: number = 10
  ): number {
    const bins: Array<{ confidenceSum: number; correctSum: number; count: number }> = [];
    for (let i = 0; i < numBins; i++) {
      bins.push({ confidenceSum: 0, correctSum: 0, count: 0 });
    }

    for (const pred of predictions) {
      const binIdx = Math.min(Math.floor(pred.confidence * numBins), numBins - 1);
      bins[binIdx].confidenceSum += pred.confidence;
      bins[binIdx].correctSum += pred.correct ? 1 : 0;
      bins[binIdx].count++;
    }

    let ece = 0;
    for (const bin of bins) {
      if (bin.count === 0) continue;
      const avgConf = bin.confidenceSum / bin.count;
      const avgAcc = bin.correctSum / bin.count;
      ece += (bin.count / predictions.length) * Math.abs(avgAcc - avgConf);
    }

    return ece;
  }

  /**
   * Calibrates a confidence score and evaluates reliability.
   */
  public evaluateConfidence(rawConfidence: number): CalibrationResult {
    const calibrated = this.calibrate(rawConfidence);
    return {
      originalConfidence: rawConfidence,
      calibratedConfidence: calibrated,
      expectedCalibrationError: Math.abs(rawConfidence - calibrated),
      isReliable: calibrated > 0.5,
    };
  }
}
