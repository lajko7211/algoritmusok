export class Stepper {
  constructor() {
    this.steps = [];
    this.index = 0;
    this.timer = null; 
    this.onApply = () => {};
  }

  load(steps) {
    this.steps = steps || [];
    this.index = 0;
    this.apply();
  }

  apply() {
    const s = this.steps[this.index];
    this.onApply(s, this.index, this.steps.length);
  }

  next() {
    if (this.index < this.steps.length - 1) {
      this.index++;
      this.apply();
    }
  }

  prev() {
    if (this.index > 0) {
      this.index--;
      this.apply();
    }
  }

  reset() {
    this.index = 0;
    this.apply();
  }

  play() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      document.querySelector("#play").textContent = "Auto";
      return;
    }
    document.querySelector("#play").textContent = "Szünet";
    this.timer = setInterval(() => {
      if (this.index < this.steps.length - 1) this.next();
      else this.play();
    }, 900);
  }
}
