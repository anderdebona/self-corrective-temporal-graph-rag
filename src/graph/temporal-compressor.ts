export interface TemporalIntervalFact {
  id: string;
  entity: string;
  property: string;
  value: string;
  validFrom: number;
  validTo: number;
}

export interface CompressedInterval {
  entity: string;
  property: string;
  value: string;
  validFrom: number;
  validTo: number;
  mergedFactCount: number;
}

export class TemporalGraphCompressor {
  /**
   * Compresses consecutive or overlapping time intervals of identical entity-property-value tuples
   */
  public static compress(facts: TemporalIntervalFact[]): CompressedInterval[] {
    if (facts.length === 0) return [];

    // Group by key
    const groups = new Map<string, TemporalIntervalFact[]>();
    for (const fact of facts) {
      const key = `${fact.entity}::${fact.property}::${fact.value}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(fact);
    }

    const result: CompressedInterval[] = [];

    for (const groupFacts of groups.values()) {
      groupFacts.sort((a, b) => a.validFrom - b.validFrom);

      let currentInterval: CompressedInterval = {
        entity: groupFacts[0].entity,
        property: groupFacts[0].property,
        value: groupFacts[0].value,
        validFrom: groupFacts[0].validFrom,
        validTo: groupFacts[0].validTo,
        mergedFactCount: 1,
      };

      for (let i = 1; i < groupFacts.length; i++) {
        const next = groupFacts[i];
        if (next.validFrom <= currentInterval.validTo + 1) {
          // Merge overlapping / contiguous intervals
          currentInterval.validTo = Math.max(currentInterval.validTo, next.validTo);
          currentInterval.mergedFactCount++;
        } else {
          result.push(currentInterval);
          currentInterval = {
            entity: next.entity,
            property: next.property,
            value: next.value,
            validFrom: next.validFrom,
            validTo: next.validTo,
            mergedFactCount: 1,
          };
        }
      }

      result.push(currentInterval);
    }

    return result;
  }
}
