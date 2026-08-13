export interface TemporalEdge {
  from: string;
  to: string;
  timestamp: number;
  relation: string;
}

export interface TemporalPathResult {
  found: boolean;
  path: string[];
  edges: TemporalEdge[];
  totalTimeSpan: number;
}

export class BiDirectionalTemporalPathFinder {
  /**
   * Finds a time-respecting monotonic causal path from start to goal
   * i.e., timestamp(e_1) <= timestamp(e_2) <= ... <= timestamp(e_k)
   */
  public static findMonotonicPath(
    edges: TemporalEdge[],
    startNode: string,
    goalNode: string,
    minTime: number = -Infinity,
    maxTime: number = Infinity
  ): TemporalPathResult {
    if (startNode === goalNode) {
      return { found: true, path: [startNode], edges: [], totalTimeSpan: 0 };
    }

    // Build adjacency with time
    const adj = new Map<string, TemporalEdge[]>();
    for (const edge of edges) {
      if (edge.timestamp >= minTime && edge.timestamp <= maxTime) {
        if (!adj.has(edge.from)) adj.set(edge.from, []);
        adj.get(edge.from)!.push(edge);
      }
    }

    // Queue of { node, currentTime, path, edgePath }
    const queue: Array<{ node: string; currentTime: number; path: string[]; edgePath: TemporalEdge[] }> = [
      { node: startNode, currentTime: minTime, path: [startNode], edgePath: [] },
    ];

    while (queue.length > 0) {
      const { node, currentTime, path, edgePath } = queue.shift()!;

      const outgoing = adj.get(node) || [];
      for (const edge of outgoing) {
        // Enforce time monotonicity
        if (edge.timestamp >= currentTime && !path.includes(edge.to)) {
          const newPath = [...path, edge.to];
          const newEdgePath = [...edgePath, edge];

          if (edge.to === goalNode) {
            const firstTs = newEdgePath[0].timestamp;
            const lastTs = newEdgePath[newEdgePath.length - 1].timestamp;
            return {
              found: true,
              path: newPath,
              edges: newEdgePath,
              totalTimeSpan: lastTs - firstTs,
            };
          }

          queue.push({
            node: edge.to,
            currentTime: edge.timestamp,
            path: newPath,
            edgePath: newEdgePath,
          });
        }
      }
    }

    return { found: false, path: [], edges: [], totalTimeSpan: 0 };
  }
}
