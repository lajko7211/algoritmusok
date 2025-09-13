import { el, $ } from "../utils/dom.js";

export class MatrixEditor {
  constructor(root) {
    this.root = root;
    this.n = +$("#n").value;
    this.directed = $("#directed").checked;
    this.weighted = $("#weighted").checked;
    this.build();
  }
  build() {
    this.root.innerHTML = "";
    const tbl = el("table");
    const thead = el("thead");
    const trh = el("tr");
    trh.append(el("th", { html: "i/j" }));

    for (let j = 0; j < this.n; j++) {
      trh.append(el("th", { html: "V" + j }));
    }

    thead.append(trh);
    tbl.append(thead);

    const tbody = el("tbody");
    for (let i = 0; i < this.n; i++) {
      const tr = el("tr");
      tr.append(el("th", { html: "V" + i }));
      for (let j = 0; j < this.n; j++) {
        const inp = el("input", {
          type: "number",
          value: i === j ? 0 : 0,
          step: "1",
          id: `cell-${i}-${j}`,
        });
        inp.addEventListener("input", () => {
          if (!this.directed && i !== j) {
            const sym = this.root.querySelector(`#cell-${j}-${i}`);
            if (sym) sym.value = inp.value;
          }
        });
        tr.append(el("td", {}, inp));
      }
      tbody.append(tr);
    }
    tbl.append(tbody);
    this.root.append(tbl);
  }

  resize(n) {
    this.n = n;
    this.build();
  }
  toMatrix() {
    const A = [...Array(this.n)].map(() => Array(this.n).fill(0));
    for (let i = 0; i < this.n; i++)
      for (let j = 0; j < this.n; j++) {
        const raw = this.root.querySelector(`#cell-${i}-${j}`).value;
        const v = raw === "" ? 0 : Number(raw);
        A[i][j] = Number.isFinite(v) ? v : 0;
      }
    return A;
  }
  randomize() {
    const directed = $("#directed").checked;
    for (let i = 0; i < this.n; i++)
      for (let j = 0; j < this.n; j++) {
        if (i === j) {
          this.root.querySelector(`#cell-${i}-${j}`).value = 0;
          continue;
        }
        const put = Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * 9);
        this.root.querySelector(`#cell-${i}-${j}`).value = put;
        if (!directed) this.root.querySelector(`#cell-${j}-${i}`).value = put;
      }
  }
  clear() {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        this.root.querySelector(`#cell-${i}-${j}`).value = i === j ? 0 : 0;
      }
    }
  }

  loadFromArray(inputArray) {
    const inputArrayLength = inputArray.length;

    if (
      !inputArrayLength ||
      inputArray.some((r) => r.length !== inputArrayLength)
    )
      throw new Error("A betöltött mátrix nem négyzetes.");

    this.n = inputArrayLength;
    $("#n").value = inputArrayLength;
    this.build();

    for (let i = 0; i < inputArrayLength; i++) {
      for (let j = 0; j < inputArrayLength; j++) {
        const v = Number(inputArray[i][j]);
        this.root.querySelector(`#cell-${i}-${j}`).value = Number.isFinite(v)
          ? v
          : 0;
      }
    }
  }

  convertZerosToBigCost(big = 1e9) {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (i === j) continue;
        const cell = this.root.querySelector(`#cell-${i}-${j}`);
        const v = Number(cell.value) || 0;
        if (v === 0) cell.value = String(big);
      }
    }
  }
}
