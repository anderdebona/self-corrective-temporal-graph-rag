export interface TemporalNode {
  id: string;
  concept: string;
  fact: string;
  validFromYear: number;
  validUntilYear: number;
  parentConceptId?: string;
}

export class TemporalKnowledgeGraph {
  private nodes: Map<string, TemporalNode> = new Map();

  public addTemporalFact(
    id: string,
    concept: string,
    fact: string,
    validFromYear: number,
    validUntilYear: number,
    parentConceptId?: string
  ): void {
    this.nodes.set(id, {
      id,
      concept,
      fact,
      validFromYear,
      validUntilYear,
      parentConceptId,
    });
  }

  /**
   * Retrieves facts valid for a target timestamp/year, eliminating temporal context contamination.
   */
  public queryTemporal(concept: string, targetYear: number): TemporalNode[] {
    const results: TemporalNode[] = [];

    this.nodes.forEach((node) => {
      if (
        node.concept.toLowerCase().includes(concept.toLowerCase()) &&
        targetYear >= node.validFromYear &&
        targetYear <= node.validUntilYear
      ) {
        results.push(node);
      }
    });

    return results;
  }

  public getAllNodes(): TemporalNode[] {
    return Array.from(this.nodes.values());
  }
}
