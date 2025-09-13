export function dijkstraSteps(graph, start = 0) {
  const node = graph.n;
  const dist = Array(node).fill(Infinity);
  const prev = Array(node).fill(null);
  const used = new Set();
  dist[start] = 0;
  const steps = [];

  steps.push({
    phase: "Inicializálás",
    msg: `Kezdőcsúcs: V${start}. Kezdeti d táblázat.`,
    graph: { source: start },
    tables: {
      main: [["Csúcs", "d", "előd"]].concat(
        dist.map((d, i) => [
          "V" + i,
          d === Infinity ? "∞" : d,
          prev[i] === null ? "–" : "V" + prev[i],
        ])
      ),
    },
  });

  function neighbors(v) {
    const res = [];
    graph.edges.forEach((edge) => {
      if (edge.u === v) res.push([edge.v, edge.w, edge]);
      if (!graph.directed && edge.v === v) res.push([edge.u, edge.w, edge]);
    });
    return res;
  }

  while (used.size < node) {
    let v = -1,
      best = Infinity;


    for (let i = 0; i < node; i++)
      if (!used.has(i) && dist[i] < best) {
        best = dist[i];
        v = i;
      }
    if (v === -1) {
      break;
    }

    used.add(v);

    steps.push({
      phase: "Kiválasztás",
      msg: `V${v} rögzítve (d=${best}).`,
      graph: { source: start, nodes: new Set(used) },
      tables: {
        main: [["Csúcs", "d", "előd"]].concat(
          dist.map((d, i) => [
            "V" + i,
            d === Infinity ? "∞" : d,
            prev[i] === null ? "–" : "V" + prev[i],
          ])
        ),
      },
    });

    for (const [to, w] of neighbors(v)) {
      if (used.has(to)) {
        continue;
      }

      const nd = dist[v] + w;

      if (nd < dist[to]) {
        dist[to] = nd;
        prev[to] = v;
        steps.push({
          phase: "Nyújtás",
          msg: `V${v}→V${to} nyújtás: új d[V${to}]=${nd}.`,
          graph: {
            source: start,
            nodes: new Set(used),
            edges: new Set([`${v}-${to}`]),
          },
          tables: {
            main: [["Csúcs", "d", "előd"]].concat(
              dist.map((d, i) => [
                "V" + i,
                d === Infinity ? "∞" : d,
                prev[i] === null ? "–" : "V" + prev[i],
              ])
            ),
          },
        });
      }
    }
  }

  steps.push({
    phase: "Kész",
    msg: "Dijkstra algoritmus befejeződött.",
    graph: { source: start },
    tables: {
      main: [["Csúcs", "d", "előd"]].concat(
        dist.map((d, i) => [
          "V" + i,
          d === Infinity ? "∞" : d,
          prev[i] === null ? "–" : "V" + prev[i],
        ])
      ),
    },
  });

  return steps;
}
