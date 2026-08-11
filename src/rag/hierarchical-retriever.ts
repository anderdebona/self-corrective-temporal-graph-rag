export interface HierarchicalResult { level: string; results: string[]; totalRetrieved: number; }
export class HierarchicalRetriever {
  private levels: Map<string, string[]> = new Map();
  public addLevel(name: string, documents: string[]): void { this.levels.set(name, documents); }
  public retrieve(query: string, topK: number = 3): HierarchicalResult[] {
    const results: HierarchicalResult[] = [];
    for (const [level, docs] of this.levels) {
      const matched = docs.filter(d => d.toLowerCase().includes(query.toLowerCase())).slice(0, topK);
      results.push({ level, results: matched, totalRetrieved: matched.length });
    }
    return results;
  }
}
