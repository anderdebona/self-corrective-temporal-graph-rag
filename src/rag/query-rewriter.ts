export class SpeculativeQueryRewriter {
  public static rewriteQuery(originalQuery: string, targetYear: number): string {
    return `${originalQuery} in year ${targetYear} with temporal context isolation`;
  }
}
