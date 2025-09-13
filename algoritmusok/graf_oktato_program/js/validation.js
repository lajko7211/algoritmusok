
function hasNegativeEdge(graph) {
  return graph.edges.some((edge) => edge.w < 0);
}
function hasZeroWeightEdge(graph) {
  return graph.edges.some((edge) => edge.w === 0);
}

function componentsCount(graph) {
  const parent = [...Array(graph.n)].map((_, i) => i);
  const find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  const unite = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parent[b] = a;
  };
  graph.edges.forEach(({ u, v }) => unite(u, v));
  const roots = new Set(parent.map((_, i) => find(i)));
  return { count: roots.size, parent, find };
}

export function validateAlgorithm(id, ctx) {
  const out = { ok: true, errors: [], warnings: [] };
  const { g: graph, A, start, target } = ctx;

  switch (id) {
    case "dijkstra":
      if (hasNegativeEdge(graph))
        out.errors.push(
          "Dijkstra: negatív él-súly található. Csak pozitív súlyok használhatók."
        );
      if (hasZeroWeightEdge(graph))
        out.errors.push("Dijkstra: 0 súlyú él nem engedélyezett.");
      break;
    case "kruskal":
      if (graph.directed)
        out.errors.push("Kruskal: irányítatlan gráf szükséges.");
      if (graph.edges.length === 0) out.errors.push("Kruskal: nincsenek élek.");
      else {
        const { count } = componentsCount(graph);
        if (count > 1)
          out.warnings.push(
            `A gráf nem összefüggő (${count} komponens). Az MST csak komponensenként értelmezhető.`
          );
      }
      break;
    case "maxflow":
      if (start === target)
        out.errors.push("Max-Flow: a forrás és a nyelő nem lehet azonos.");
      if (hasNegativeEdge(graph))
        out.errors.push(
          "Max-Flow: negatív kapacitás található. Minden kapacitás legyen ≥ 0."
        );
      if (!graph.directed)
        out.warnings.push(
          "Max-Flow: irányítatlan éleket kétirányú kapacitásként kezeljük."
        );
      if (Array.isArray(A)) {
        for (let i = 0; i < A.length; i++)
          if (Number(A[i][i]) > 0)
            out.errors.push(
              `Max-Flow: hurokél nem engedélyezett (A[${i},${i}] = ${A[i][i]}).`
            );
      }
      if (Array.isArray(A)) {
        for (let i = 0; i < A.length; i++)
          for (let j = 0; j < A.length; j++) {
            const v = Number(A[i][j]);
            if (!Number.isFinite(v)) {
              out.errors.push(
                `Max-Flow: érvénytelen szám A[${i},${j}] = ${A[i][j]}`
              );
              continue;
            }
            if (v !== 0 && !Number.isInteger(v))
              out.errors.push(
                `Max-Flow: kapacitás legyen egész (A[${i},${j}] = ${A[i][j]})`
              );
          }
      }
      const outS =
        graph.edges.some((e) => e.u === start && e.w > 0) ||
        (!graph.directed && graph.edges.some((e) => e.v === start && e.w > 0));
      const inT =
        graph.edges.some((e) => e.v === target && e.w > 0) ||
        (!graph.directed && graph.edges.some((e) => e.u === target && e.w > 0));
      if (!outS)
        out.warnings.push(
          "A forrásból nincs kimenő kapacitás. Az áram 0 lesz."
        );
      if (!inT)
        out.warnings.push("A nyelőbe nincs bejövő kapacitás. Az áram 0 lesz.");
      break;
  }

  if (out.errors.length) out.ok = false;
  return out;
}
