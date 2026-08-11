export interface RewriteResult { original: string; rewritten: string; expansions: string[]; strategy: string; }
export class QueryRewriter {
  private synonyms: Map<string, string[]> = new Map([['rate', ['percentage', 'ratio']], ['tax', ['levy', 'duty', 'tariff']], ['price', ['cost', 'value', 'amount']]]);
  public rewrite(query: string): RewriteResult {
    const words = query.toLowerCase().split(/\s+/);
    const expansions: string[] = [];
    const expanded = words.map(w => { const syns = this.synonyms.get(w); if (syns) { expansions.push(...syns); return `(${w}|${syns.join('|')})`; } return w; });
    return { original: query, rewritten: expanded.join(' '), expansions, strategy: expansions.length > 0 ? 'SYNONYM_EXPANSION' : 'PASSTHROUGH' };
  }
}
