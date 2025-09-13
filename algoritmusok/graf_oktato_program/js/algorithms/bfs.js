export function bfsSteps(graph, start = 0) {
  const steps = [];
  const visited = new Set();
  const frontier = new Set();
  const queue = [];

  queue.push(start);
  frontier.add(start);

  steps.push({
    phase: "Inicializálás",
    msg: `Kiindulás V${start} csúcsból. Sor: [${queue.join(", ")}]`,
    graph: { source: start, frontier: new Set(frontier) },
    tables: { main: [["Csúcs", "Állapot", "Megjegyzés"]], aux: [["Sor"]] },
  });

  while (queue.length) {
    const node = queue.shift();
    frontier.delete(node);
    visited.add(node);

    steps.push({
      phase: "Kivétel a sorból",
      msg: `V${node} feldolgozása.`,
      graph: { source: start, nodes: new Set(visited) },
      tables: { aux: [["Sor", queue.join(", ")]] },
    });

    const neighbor = [];

    graph.edges.forEach((edge) => {
      if (edge.u === node) {
        neighbor.push({ to: edge.v, w: edge.w });
      }
      if (!graph.directed && edge.v === node) {
        neighbor.push({ to: edge.u, w: edge.w });
      }
    });

    neighbor.sort((a, b) => a.to - b.to);

    for (const { to } of neighbor) {
      if (!visited.has(to) && ![...frontier].includes(to)) {
        queue.push(to);
        frontier.add(to);
        steps.push({
          phase: "Szomszéd bejárása",
          msg: `V${to} beillesztése a sor végére.`,
          graph: {
            source: start,
            nodes: new Set(visited),
            frontier: new Set(frontier),
          },
          tables: { aux: [["Sor", queue.join(", ")]] },
        });
      }
    }
  }

  steps.push({
    phase: "Kész",
    msg: `Minden elérhető csúcs bejárva: {${[...visited]
      .map((i) => "V" + i)
      .join(", ")}}.`,
    graph: { source: start, nodes: new Set(visited) },
  });

  return steps;
}
