export function hungarianSteps(A) {
  const n = A.length;
  const adj = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => Number(A[i][j]) > 0)
  );

  const matchL = Array(n).fill(-1);
  const matchU = Array(n).fill(-1);

  const steps = [];

  const tblMatching = (title = "Párosítás") => {
    const head = [title, "Pár (L→U)"];
    const rows = [];
    for (let i = 0; i < n; i++)
      rows.push([`L${i}`, matchL[i] >= 0 ? `U${matchL[i]}` : "—"]);
    return [head, ...rows];
  };

  const tblCover = (coverL, coverU, title = "Lefogó ponthalmaz") => {
    const head = [title, "Halmaz"];
    const Lset = coverL.map((v, i) => (v ? `L${i}` : null)).filter(Boolean);
    const Uset = coverU.map((v, j) => (v ? `U${j}` : null)).filter(Boolean);
    return [
      head,
      ["Alsó (L)", Lset.length ? Lset.join(", ") : "∅"],
      ["Felső (U)", Uset.length ? Uset.join(", ") : "∅"],
      ["|C|", String(Lset.length + Uset.length)],
    ];
  };

  const tblFrontier = (Q, title = "Frontier / sor") => {
    const head = [title, "Csúcsok"];
    const items = Q.map((x) => (x.side === "L" ? `L${x.idx}` : `U${x.idx}`));
    return [head, [items.length ? items.join(", ") : "∅"]];
  };

  function graphState({ labL = null, labU = null, frontier = null } = {}) {
    const edges = [];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (adj[i][j]) edges.push([i, j]);
    const matched = [];
    for (let i = 0; i < n; i++)
      if (matchL[i] >= 0) matched.push([i, matchL[i]]);
    const labelsL = labL ? labL.map((v) => v >= 0) : Array(n).fill(false);
    const labelsU = labU ? labU.map((v) => v >= 0) : Array(n).fill(false);
    const frontierL = [],
      frontierU = [];
    if (frontier && frontier.length) {
      for (const f of frontier)
        (f.side === "L" ? frontierL : frontierU).push(f.idx);
    }
    return {
      type: "hungarian",
      n,
      edges,
      matched,
      labelsL,
      labelsU,
      frontierL,
      frontierU,
    };
  }

  const addStep = (phase, msg, { tables, labL, labU, frontier } = {}) => {
    steps.push({
      phase,
      msg,
      tables,
      graph: graphState({ labL, labU, frontier }),
    });
  };


  function augmentFrom(freeU, parentL, parentU, labL, labU) {
    const path = [];
    let uj = freeU;
    while (true) {
      path.push({ side: "U", idx: uj });
      const i = parentU[uj];
      if (i == null || i < 0) break;
      path.push({ side: "L", idx: i });
      const pj = parentL[i];
      if (pj == null || pj < 0) break;
      uj = pj;
    }
    path.reverse();

  
    for (let k = 0; k < path.length - 1; k++) {
      const a = path[k],
        b = path[k + 1];
      if (a.side === "L" && b.side === "U") {
        matchL[a.idx] = b.idx;
        matchU[b.idx] = a.idx;
      } else if (a.side === "U" && b.side === "L") {
        matchL[b.idx] = -1;
        matchU[a.idx] = -1;
      }
    }

    addStep(
      "Alternáló út augmentálása",
      `Javító út mentén növeltük a párosítást: ${path
        .map((p) => (p.side === "L" ? `L${p.idx}` : `U${p.idx}`))
        .join(" → ")}.`,
      {
        tables: { main: tblMatching("Párosítás augmentálás után") },
        labL,
        labU,
        frontier: [],
      }
    );
  }
  function findAndAugment() {
    const labL = Array(n).fill(-1);
    const labU = Array(n).fill(-1);
    const parentL = Array(n).fill(-1);
    const parentU = Array(n).fill(-1);

    const Q = [];
    for (let i = 0; i < n; i++)
      if (matchL[i] === -1) {
        labL[i] = 0;
        Q.push({ side: "L", idx: i });
      }
    addStep("Inicializálás", "Az alsó párosítatlan csúcsok 0 címkét kaptak.", {
      tables: { main: tblMatching(), aux: tblFrontier(Q, "Kezdő sor") },
      labL,
      labU,
      frontier: Q.slice(),
    });

    let foundFreeU = -1;

    while (Q.length && foundFreeU === -1) {
      const v = Q.shift();

      if (v.side === "L") {
        const i = v.idx;
        for (let j = 0; j < n; j++) {
          if (!adj[i][j]) continue;
          if (labU[j] >= 0) continue;
          labU[j] = labL[i] + 1;
          parentU[j] = i;

          if (matchU[j] === -1) {
            foundFreeU = j;
            addStep(
              "Javító út vége",
              `Elértünk egy felső párosítatlan csúcsot: U${j}.`,
              {
                tables: { main: tblMatching(), aux: tblFrontier(Q) },
                labL,
                labU,
                frontier: Q.slice(),
              }
            );
            break;
          }

          const k = matchU[j];
          if (labL[k] < 0) {
            labL[k] = labU[j] + 1;
            parentL[k] = j;
            Q.push({ side: "L", idx: k });
          }
        }
        if (foundFreeU !== -1) break;

        addStep(
          "Címkézés (fel → le)",
          `Az L${i} szomszédai közül megcímkéztük a még nem címkézett U-csúcsokat. Párosított él mentén visszajelöltünk L-be.`,
          { tables: { main: tblMatching() }, labL, labU, frontier: Q.slice() }
        );
      }
    }

    if (foundFreeU !== -1) {
      augmentFrom(foundFreeU, parentL, parentU, labL, labU);
      return true;
    }

    const coverL = Array(n).fill(false);
    const coverU = Array(n).fill(false);
    for (let i = 0; i < n; i++) coverL[i] = labL[i] < 0;
    for (let j = 0; j < n; j++) coverU[j] = labU[j] >= 0;

    steps.push({
      phase: "Elakadás",
      msg: "Nincs javító út – a párosítás maximális.",
      tables: {
        main: tblMatching("Végső párosítás"),
        aux: tblCover(coverL, coverU),
      },
      graph: graphState({ labL, labU, frontier: [] }),
    });

    return false;
  }

  steps.push({
    phase: "Kezdet",
    msg: "Üres/aktuális párosításból indulunk.",
    tables: { main: tblMatching("Kezdeti párosítás") },
    graph: graphState({}),
  });
  while (true) {
    const augmented = findAndAugment();
    if (!augmented) break;
  }
  const size = matchL.filter((j) => j >= 0).length;
  const finalRows = [["L", "U"]];
  for (let i = 0; i < n; i++)
    if (matchL[i] >= 0) finalRows.push([`L${i}`, `U${matchL[i]}`]);
  steps.push({
    phase: "Kész",
    msg: `Maximális párosítás mérete: ${size}.`,
    tables: { main: [["Végső párok"], ["|M| = " + size], ...finalRows] },
    graph: graphState({}),
  });

  return steps;
}
