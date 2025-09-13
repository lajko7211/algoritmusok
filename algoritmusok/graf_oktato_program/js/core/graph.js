export class Graph {
  constructor(n, directed = false) {
    this.n = n;
    this.directed = directed;
    this.nodes = [...Array(n)].map((_, i) => ({ id: i, x: 0, y: 0 }));
    this.edges = [];
  }
  static fromAdj(A, directed = false) {
    const n = A.length;
    const g = new Graph(n, directed);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const w = A[i][j];
        if (w !== 0) {
          if (directed || i < j) g.edges.push({ u: i, v: j, w });
        }
      }
    return g;
  }
}
