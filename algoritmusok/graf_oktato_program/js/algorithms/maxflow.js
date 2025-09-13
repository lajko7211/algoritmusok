export function maxflowSteps(graph, s = 0, t = graph.n - 1) {
  const nodes = graph.n;
  const C = [...Array(nodes)].map(() => Array(nodes).fill(0));
  graph.edges.forEach((edge) => {
    C[edge.u][edge.v] += edge.w;
    if (!graph.directed) {
      C[edge.v][edge.u] += edge.w;
    }
  });
  const steps = [];
  let flow = 0;
  const parent = Array(nodes);

  function bfs() {
    parent.fill(-1);
    parent[s] = -2;
    const q = [[s, Infinity]];
    while (q.length) {
      const [v, cap] = q.shift();
      for (let to = 0; to < nodes; to++) {
        if (parent[to] === -1 && C[v][to] > 0) {
          parent[to] = v;
          const newCap = Math.min(cap, C[v][to]);
          if (to === t) return newCap;
          q.push([to, newCap]);
        }
      }
    }
    return 0;
  }

  steps.push({
    phase: "Inicializálás",
    msg: `Forrás V${s}, nyelő V${t}. Összáram=0.`,
  });
  while (true) {
    const aug = bfs();
    if (aug === 0) break;
    flow += aug;
    const path = [];
    let cur = t;
    while (cur !== s) {
      path.push([parent[cur], cur]);
      C[parent[cur]][cur] -= aug;
      C[cur][parent[cur]] += aug;
      cur = parent[cur];
    }
    steps.push({
      phase: "Növelő út",
      msg: `Út kapacitás=${aug}. Összáram=${flow}. Út: ${path
        .slice()
        .reverse()
        .map((p) => `V${p[0]}→V${p[1]}`)
        .join(" → ")}`,
      graph: { edges: new Set(path.map((p) => `${p[0]}-${p[1]}`)), source: s },
    });
  }
  steps.push({ phase: "Kész", msg: `Maximális áram = ${flow}.` });

  console.log("Max-Flow steps in maxflow.js:", steps);
  return steps;
}
