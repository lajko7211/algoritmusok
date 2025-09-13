import { $, el, clamp, toast } from "./utils/dom.js";
import { Stepper } from "./utils/stepper.js";
import { Graph } from "./core/graph.js";
import { GraphView } from "./core/view.js";
import { HungarianView } from "./core/hungarian_view.js";
import { MatrixEditor } from "./core/matrix.js";
import { validateAlgorithm } from "./validation.js";
import { MODULES, loadAlgorithm } from "./modules.js";

const algoCache = new Map();

async function getAlgorithm(id) {
  if (algoCache.has(id)) {
    return algoCache.get(id);
  }

  const mod = await loadAlgorithm(id);
  algoCache.set(id, mod);
  return mod;
}


const Matrix = new MatrixEditor($("#matrix"));
const View = new GraphView($("#graphSvg"), {
  onNodeDblClick: (node) => UI.setStart(node),
});
let HungView = null;
const Steps = new Stepper();
Steps.onApply = (s, index, total) => UI.renderStep(s, index, total);

function parseMatrixText(text) {
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0)
    .map((r) => r.split(/\s+/).map((x) => Number(x)));

  if (rows.length === 0) throw new Error("Üres fájl.");
  const n = rows[0].length;
  if (rows.some((r) => r.length !== n))
    throw new Error(
      "Nem egységes a sorhossz (a megadott mátrix nem négyzetes vagy hiányos)."
    );
  if (rows.length !== n)
    throw new Error("A megadott mátrix nem négyzetes (sorok ≠ oszlopok).");

  if (rows.length > 12)
    throw new Error(
      "A megadott mátrix nagyobb, mint a maximális engedélyezett (12x12)."
    );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!Number.isFinite(rows[i][j])) {
        throw new Error(
          `Nem szám szerepel a (${i},${j}) pozíción: "${rows[i][j]}"`
        );
      }
    }
  }
  return rows;
}

$("#fileInput").addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];

  if (!file) return;
  const isText =
    (file.type && file.type.startsWith("text")) || /\.txt$/i.test(file.name);

  if (!isText) {
    toast("Csak szövegfájl tölthető fel (.txt formátum).");
    e.target.value = "";
    return;
  }

  try {
    const text = await file.text();
    const A = parseMatrixText(text);
    Matrix.loadFromArray(A);
    toast(`Mátrix betöltve (${A.length}×${A.length}).`);
    document.querySelector("#buildGraph").click();
  } catch (err) {
    console.error(err);
    toast("Gráf betöltési hiba: " + err.message);
  } finally {
    e.target.value = "";
  }
});

function renderBuildSteps(A, directed) {
  const tb = $("#buildTbody");
  tb.innerHTML = "";
  const ops = [];
  const n = A.length;
  ops.push([
    "Inicializálás",
    `Mátrix beolvasása (${n}×${n}), irányított=${directed}.`,
  ]);

  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (A[i][j] !== 0)
        ops.push([
          "Él létrehozása",
          `V${i} → V${j}, súly/kapacitás: ${A[i][j]}`,
        ]);
  ops.forEach((r, idx) => {
    const tr = el("tr", { class: idx === 0 ? "highlight" : "" });

    tr.append(
      el("td", { html: String(idx) }),
      el("td", { html: r[0] }),
      el("td", { html: r[1] })
    );

    tb.append(tr);
  });
}

const UI = {
  graph: null,
  currentAlgorithm: "bfs",
  startNode: 0,
  targetNode: 1,

  setStart(node) {
    this.startNode = node;
    toast(`Kezdőcsúcs: V${node}`);
    View.setHighlights({ source: node });
    this.runAlgorithm();
  },

  setTarget(node) {
    this.targetNode = node;
    toast(`Célcsúcs: V${node}`);
    this.runAlgorithm();
  },

  async runAlgorithm() {
    const A = Matrix.toMatrix();

    if (this.currentAlgorithm === "hungarian") {
      if (!HungView) {
        HungView = new HungarianView($("#graphSvg"));
      }
      HungView.setMatrix(A);

      const mod = await getAlgorithm("hungarian");
      const steps = mod.hungarianSteps(A.map((r) => r.slice()));
      Steps.load(steps);
      this.graph = null;
      return;
    }

    const directed = $("#directed").checked;
    const g = Graph.fromAdj(A, directed);
    this.graph = g;
    View.setGraph(g);

    const { ok, errors, warnings } = validateAlgorithm(this.currentAlgorithm, {
      g,
      A,
      start: this.startNode,
      target: this.targetNode,
    });

    if (warnings.length) {
      warnings.forEach((w) => toast("Figyelmeztetés: " + w));
    }

    if (!ok) {
      $("#explain").textContent = "Hiba: " + errors.join(" | ");
      $("#stepKpi").textContent = "–";
      $("#phaseKpi").textContent = "Hiba";
      Steps.reset();
      return;
    }

    const mod = await getAlgorithm(this.currentAlgorithm);
    let steps = [];
    if (this.currentAlgorithm === "bfs") {
      steps = mod.bfsSteps(g, this.startNode);
    } else if (this.currentAlgorithm === "dijkstra") {
      steps = mod.dijkstraSteps(g, this.startNode);
    } else if (this.currentAlgorithm === "hungarian") {
      const n = A.length;
      const M = A.map((r) => r.slice());
      steps = mod.hungarianSteps(M);
    } else if (this.currentAlgorithm === "kruskal") {
      steps = mod.kruskalSteps(g);
    } else if (this.currentAlgorithm === "maxflow") {
      steps = mod.maxflowSteps(g, this.startNode, this.targetNode);
    }
    Steps.load(steps);
  },

  renderStep(s, idx, total) {
    $("#stepKpi").textContent = `${idx + 1}/${total || "–"}`;
    $("#phaseKpi").textContent = s ? s.phase : "–";
    $("#explain").textContent = s ? s.msg : "—";

    if (s && s.graph && s.graph.type === "hungarian") {
      HungView?.renderOverlay(s.graph);
      return;
    }

    if (this.graph) {
      const hi = {
        nodes: s?.graph?.nodes || new Set(),
        edges: s?.graph?.edges || new Set(),
        source: s?.graph?.source ?? View.highlight.source,
        frontier: s?.graph?.frontier || new Set(),
      };
      View.setHighlights(hi);
    }
  },
};

function refreshAdjFlags() {
  Matrix.directed = $("#directed").checked;
  Matrix.weighted = $("#weighted").checked;
}

$("#resize").addEventListener("click", () => {
  const n = clamp(+$("#n").value, 2, 12);
  Matrix.resize(n);
});

$("#randomize").addEventListener("click", () => Matrix.randomize());

$("#clear").addEventListener("click", () => Matrix.clear());

$("#directed").addEventListener("change", () => {
  refreshAdjFlags();
  toast($("#directed").checked ? "Irányított mód" : "Irányítatlan mód");
});

$("#weighted").addEventListener("change", () => {
  refreshAdjFlags();
  toast($("#weighted").checked ? "Súlyok bekapcsolva" : "Súlyok kikapcsolva");
});

$("#buildGraph").addEventListener("click", () => {
  const A = Matrix.toMatrix();

  const directed = $("#directed").checked;
  const g = Graph.fromAdj(A, directed);
  UI.graph = g;
  View.setGraph(g);
  renderBuildSteps(A, directed);
  toast("Gráf felépítve.");
  UI.startNode = 0;
  UI.targetNode = Math.min(1, g.n - 1);
  View.setHighlights({ source: 0 });
});

$("#next").addEventListener("click", () => Steps.next());
$("#prev").addEventListener("click", () => Steps.prev());
$("#reset").addEventListener("click", () => Steps.reset());
$("#play").addEventListener("click", () => Steps.play());

const ALGORITHMS = [
  {
    id: "bfs",
    name: "Szélességi (BFS)",
    params: () =>
      el(
        "div",
        {},
        el("label", { html: "Kiindulási csúcs száma: " }),
        (() => {
          const s = el("input", {
            type: "number",
            min: 0,
            max: Matrix.n - 1,
            value: UI.startNode,
          });
          s.addEventListener("input", () => {
            UI.setStart(clamp(+s.value, 0, Matrix.n - 1));
          });
          return s;
        })()
      ),
  },
  {
    id: "dijkstra",
    name: "Dijkstra",
    params: () =>
      el(
        "div",
        {},
        el("label", { html: "Kiindulási csúcs száma: " }),
        (() => {
          const s = el("input", {
            type: "number",
            min: 0,
            max: Matrix.n - 1,
            value: UI.startNode,
          });
          s.addEventListener("input", () => {
            UI.setStart(clamp(+s.value, 0, Matrix.n - 1));
          });
          return s;
        })()
      ),
  },
  {
    id: "hungarian",
    name: "Magyar módszer",
    params: () =>
      el(
        "div",
        {},
        el("span", {
          class: "hint",
          html: "A[i][j]>0 ⇒ él Lᵢ–Uⱼ. Címkék és párosítás kiemelve.",
        })
      ),
  },
  {
    id: "kruskal",
    name: "Kruskal (MST)",
    params: () =>
      el(
        "div",
        {},
        el("span", {
          class: "hint",
          html: "Irányítatlan, súlyozott gráf szükséges.",
        })
      ),
  },
  {
    id: "maxflow",
    name: "Ford–Fulkerson",
    params: () =>
      el(
        "div",
        {},
        el("label", { html: "Forrás:" }),
        (() => {
          const s = el("input", {
            type: "number",
            min: 0,
            max: Matrix.n - 1,
            value: UI.startNode,
          });
          s.addEventListener("input", () => {
            UI.startNode = clamp(+s.value, 0, Matrix.n - 1);
            UI.runAlgo();
          });
          return s;
        })(),
        el("label", { html: "Nyelő:" }),
        (() => {
          const t = el("input", {
            type: "number",
            min: 0,
            max: Matrix.n - 1,
            value: UI.targetNode,
          });
          t.addEventListener("input", () => {
            UI.targetNode = clamp(+t.value, 0, Matrix.n - 1);
            UI.runAlgo();
          });
          return t;
        })()
      ),
  },
];

function renderTabs() {
  const wrap = $("#algoTabs");
  wrap.innerHTML = "";

  ALGORITHMS.forEach((a) => {
    const tab = el("div", {
      class: "tab" + (UI.currentAlgorithm === a.id ? " active" : ""),
      html: a.name,
    });
    tab.addEventListener("click", async () => {
      UI.currentAlgorithm = a.id;
      renderTabs();
      renderParams();
      await UI.runAlgorithm();
    });
    wrap.append(tab);
  });
}

function renderParams() {
  const p = $("#algoParams");
  p.innerHTML = "";
  const conf = ALGORITHMS.find((x) => x.id === UI.currentAlgorithm);
  if (conf && conf.params) p.append(conf.params());
}


Matrix.randomize();
document.querySelector("#buildGraph").click();
UI.currentAlgorithm = "bfs";
renderTabs();
UI.runAlgorithm();
