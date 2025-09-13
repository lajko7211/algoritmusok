export const MODULES = {
  algorithms: {
    bfs: "./algorithms/bfs.js",
    dijkstra: "./algorithms/dijkstra.js",
    hungarian: "./algorithms/hungarian.js",
    kruskal: "./algorithms/kruskal.js",
    maxflow: "./algorithms/maxflow.js",
  },
  core: {
    graph: "./core/graph.js",
    view: "./core/view.js",
    hungarian_view: "./core/hungarian_view.js",
    matrix: "./core/matrix.js",
  },
  utils: {
    dom: "./utils/dom.js",
    stepper: "./utils/stepper.js",
    validation: "./validation.js",
  },
};

export async function loadAlgorithm(id) {
  const path = MODULES.algorithms[id];
  if (!path) throw new Error("Ismeretlen algoritmus: " + id);
  return import(path);
}
