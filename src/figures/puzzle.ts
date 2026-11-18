import { Cam, clamp, facing, fit, prism, proj, rings, unproj } from "../core/iso";
import { spring, stepS, type Spring } from "../core/motion";
import { disposer, flatDot, mk, place, pointer, put, register, solid, type FigureMount, type Solid } from "../core/stage";
import { lid, slab } from "../slab";

/**
 * Puzzle: eight tiles and a gap in a tray, each tile counted in pips. The
 * pointer pushes: a tile in the gap's row or column slides toward the gap,
 * and takes with it whatever tiles lie between. The tile last pushed is
 * bright and the count of moves goes to the read-out. On leaving, the
 * puzzle solves itself the honest way, taking back every move in turn, last
 * first. The slider is how briskly the tiles slide.
 *
 * The pattern: one of many, on springs. The tiles move but the cells do
 * not, so the pick is always made on the same nine squares.
 */

const N = 3, PITCH = 26, HALF = 11.6, Z = 2, TOP = 7, SIDE = N * PITCH, GAP = N * N - 1;
const at = (cell: number) => [PITCH / 2 + (cell % N) * PITCH, PITCH / 2 + Math.floor(cell / N) * PITCH];
/** Which of a tile's nine places carry a pip, for one to eight. */
const PIPS = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8], [0, 2, 3, 4, 5, 6, 8], [0, 1, 2, 3, 5, 6, 7, 8]];

type Tile = { n: number; el: Solid; pips: Array<{ el: SVGEllipseElement; i: number }>; x: Spring; y: Spring; drawn: number };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.15);
  fit(C, [[-5, -5, 0], [SIDE + 5, -5, 0], [SIDE + 5, SIDE + 5, 0], [-5, SIDE + 5, 0], [-5, -5, TOP]], 200, 164);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const [to, ti] = rings(-5, -5, SIDE + 5, SIDE + 5, 8, 2.4);
  put(solid(g), prism(P, front, to, ti, 0, Z));

  // the tiles share one layer, kept far to near
  const layer = mk("g", {}, g), damp = (k: number) => 2 * Math.sqrt(k) * 0.85;
  const tiles: Tile[] = PIPS.map((pips, n) => {
    const el = solid(layer), [x, y] = at(n), o = { k: value, c: damp(value), eps: 0.01 };
    return { n, el, pips: pips.map((i) => ({ el: flatDot(el.g, C, 1.15, "dot m"), i })), x: spring(x, o), y: spring(y, o), drawn: NaN };
  });
  function draw(t: Tile) {
    const key = t.x.x * 1000 + t.y.x;
    if (key === t.drawn) return;
    t.drawn = key;
    const [ring, inner] = lid(t.x.x - HALF, t.y.x - HALF, t.x.x + HALF, t.y.x + HALF, 3.6, 1.1);
    put(t.el, slab(P, front, ring, inner, Z + 0.5, TOP));
    for (const p of t.pips) place(p.el, P(t.x.x + (p.i % 3 - 1) * 6, t.y.x + (Math.floor(p.i / 3) - 1) * 6, TOP));
  }

  // which tile is in each cell, the gap as -1; and where the gap was before each move
  const cells = tiles.map((t) => t.n).concat(-1), past: number[] = [];
  let gap = GAP, lit = -1, over = false, wait = 0, pace = 0.12, order = "";
  function light(n: number) {
    if (n === lit) return;
    lit = n;
    tiles.forEach((t) => { t.el.sil.classList.toggle("hi", t.n === n); t.pips.forEach((p) => p.el.setAttribute("class", t.n === n ? "dot" : "dot m")); });
  }
  /** Pushes the tile in a cell toward the gap, with all between. Returns whether anything could move. */
  function push(cell: number) {
    const ci = cell % N, cj = Math.floor(cell / N), gi = gap % N, gj = Math.floor(gap / N);
    if (cell === gap || (ci !== gi && cj !== gj)) return false;
    const step = ci === gi ? (cj < gj ? -N : N) : (ci < gi ? -1 : 1);
    for (let c = gap; c !== cell; c += step) {
      const t = tiles[cells[c + step]], [x, y] = at(c);
      cells[c] = t.n; t.x.t = x; t.y.t = y;
    }
    light(cells[cell + (ci === gi ? (cj < gj ? N : -N) : (ci < gi ? 1 : -1))] ?? lit);
    cells[cell] = -1; gap = cell;
    return true;
  }

  const B = register(stage, (dt) => {
    let m = false;
    if (!over && past.length) {
      // taking the moves back, one at a time
      wait -= dt;
      if (wait <= 0) { push(past.pop()!); wait = pace; if (!past.length) light(tiles[GAP - 1].n); }
      m = true;
    }
    for (const t of tiles) { m = stepS(t.x, dt) || m; m = stepS(t.y, dt) || m; draw(t); }
    const pile = tiles.slice().sort((a, b) => a.x.x + a.y.x - b.x.x - b.y.x), sig = pile.map((t) => t.n).join();
    if (sig !== order) { order = sig; pile.forEach((t) => layer.appendChild(t.el.g)); }
    return m;
  });
  bag.add(B.unregister);
  light(tiles[GAP - 1].n);

  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], TOP);
      over = true;
      if (x >= 0 && x < SIDE && y >= 0 && y < SIDE) {
        const was = gap;
        if (push(clamp(Math.floor(x / PITCH), 0, N - 1) + N * clamp(Math.floor(y / PITCH), 0, N - 1))) past.push(was);
      }
      read.textContent = "move " + past.length;
      B.wake();
    },
    leave: () => {
      over = false;
      pace = clamp(1.6 / Math.max(1, past.length), 0.05, 0.16);
      wait = 0.2;
      read.textContent = "rest";
      B.wake();
    },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { for (const t of tiles) for (const s of [t.x, t.y]) { s.k = v; s.c = damp(v); } },
    destroy: bag.dispose,
  };
};
