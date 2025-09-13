export function kruskalSteps(graph) {
  const steps = [];
  if (graph.directed) {
    steps.push({
      phase: "Hiba",
      msg: "Irányítatlan gráf szükséges.",
    });
    return steps;
  }
  const edges = [...graph.edges].map((edge) => ({
    u: edge.u,
    v: edge.v,
    w: edge.w,
    id: `${edge.u}-${edge.v}`,
  }));
  edges.sort((a, b) => a.w - b.w);
  const parent = [...Array(graph.n)].map((_, i) => i),
    rank = Array(graph.n).fill(0);
  const chosen = [];
  const find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  const unite = (a, b) => {
    a = find(a);
    b = find(b);
    if (a === b) return false;
    if (rank[a] < rank[b]) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a]++;
    return true;
  };

  const compPar = [...Array(graph.n)].map((_, i) => i);
  const compFind = (a) =>
    compPar[a] === a ? a : (compPar[a] = compFind(compPar[a]));
  const compUnion = (a, b) => {
    a = compFind(a);
    b = compFind(b);
    if (a !== b) compPar[b] = a;
  };
  edges.forEach((edge) => compUnion(edge.u, edge.v));
  const rootsMap = new Map();
  let idx = 0;
  const compLabel = [...Array(graph.n)].map((_, i) => {
    const r = compFind(i);
    if (!rootsMap.has(r)) rootsMap.set(r, idx++);
    return "C" + rootsMap.get(r);
  });
  steps.push({
    phase: "Komponensek",
    msg: `Bemeneti gráf komponensei: ${[...new Set(compLabel)].join(", ")}.`,
    tables: {
      main: [["Csúcs", "Komponens"]].concat(
        compLabel.map((lab, i) => ["V" + i, lab])
      ),
    },
  });

  const dsuTable = () =>
    [["i", "parent[i]", "rank[i]"]].concat(
      parent.map((_, i) => [i, parent[i], rank[i]])
    );

  steps.push({
    phase: "Inicializálás",
    msg: `Élek rendezve: ${edges
      .map((e) => `(${e.u},${e.v},${e.w})`)
      .join(" ")}`,
    tables: { aux: dsuTable() },
  });

  for (const e of edges) {
    const merged = unite(e.u, e.v);
    if (merged) {
      chosen.push(e);
      steps.push({
        phase: "Él felvétele",
        msg: `(${e.u},${e.v}) w=${e.w} hozzáadva.`,
        graph: { edges: new Set(chosen.map((x) => x.id)) },
        tables: { aux: dsuTable() },
      });
    } else {
      steps.push({
        phase: "Ciklus elkerülése",
        msg: `(${e.u},${e.v}) kihagyva.`,
        tables: { aux: dsuTable() },
      });
    }
  }

  steps.push({
    phase: "Kész",
    msg: `MST összsúly = ${chosen.reduce((s, e) => s + e.w, 0)}.`,
    graph: { edges: new Set(chosen.map((x) => x.id)) },
    tables: { aux: dsuTable() },
  });

  return steps;
}
