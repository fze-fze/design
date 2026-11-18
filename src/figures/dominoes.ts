import { Cam, clamp, fit, hull, open, poly, prism, proj, rings, rrect, run, seg, type Sample, type Vec2 } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount, type Solid } from "../core/stage";

/**
 * Dominoes: a row of nine on a plinth, falling away from the viewer. The
 * pointer's place along the row is how far the fall has run: the domino there
 * tips toward the next, and every one before it lies on the one after, each
 * angle solved from the contact, so nothing passes through anything. At rest
 * the fall is caught on the third domino, which is bright. The slider is the
 * stiffness of the spring the wave front rides on: stiffer runs faster.
 *
 * The pattern: scrub. One spring on one number, the front; every pose is
 * read from it. The pick is the pointer projected on the row's fixed axis.
 */

const N = 9, D = 17, H = 40, W = 20, T = 5, REST = 2.45, PR = 1.5;
/** How far a domino tips before its top meets the upright one behind it. */
const TOUCH = Math.asin((D - T) / H);
/** The angle of a domino lying on the next, which itself stands at phi: its top edge on the other's face. */
const lean = (phi: number) => phi + Math.asin(clamp((D * Math.cos(phi) - T) / H, -1, 1));
/** A face in its own plane: u up the domino, v across it. */
const FACE = /* @__PURE__ */ rrect(0, -W / 2, H, W / 2, 2.2, 5);
/** Each domino's two halves, as pips. */
const PIPS = [[3, 1], [2, 4], [5, 2], [1, 3], [4, 4], [2, 1], [3, 5], [1, 2], [4, 3]];
const SPOT: Record<number, number[][]> = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
};

type Tile = { el: Solid; pips: SVGPathElement; spots: Vec2[]; px: number; drawn: number; on: boolean };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.55);
  const X0 = -(N - 1) * D - T / 2 - H - 6, X1 = T / 2 + 9, Y = W / 2 + 9;
  fit(C, [[X0, -Y, -5], [X1, -Y, -5], [X1, Y, -5], [X0, Y, -5], [0, -W / 2, H], [-(N - 1) * D, -W / 2, H]], 200, 168);
  const P = proj(C);
  // toward the camera, in world: what decides which edge of a face is seen
  const zf = Math.sqrt(1 - C.k * C.k), cx = zf * Math.sin(C.az), cy = zf * Math.cos(C.az);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(X0, -Y, X1, Y, 8, 2);
  put(solid(g), prism(P, (q) => q.nu * cx + q.nv * cy >= -1e-6, pr, pi, -5, 0));
  // the track the row stands on, under the dominoes
  mk("path", { class: "nf dash", d: seg(P(X0 + 9, 0, 0), P(X1 - 5, 0, 0)) }, g);

  // far end first: each domino falls back onto the one behind it, so the near one always paints over
  const tiles: Tile[] = [];
  for (let j = N - 1; j >= 0; j--) {
    const el = solid(g), pips = mk("path", { class: "dot m" }, el.g), spots: Vec2[] = [];
    PIPS[j].forEach((n, half) => SPOT[n].forEach(([a, b]) => spots.push([H / 4 + half * H / 2 + a * 5.2, b * 5.2])));
    tiles[j] = { el, pips, spots, px: -j * D - T / 2, drawn: NaN, on: false };
  }

  const th = new Array<number>(N).fill(0);
  function draw(t: Tile, a: number) {
    if (a === t.drawn) return;
    t.drawn = a;
    const s = Math.sin(a), c = Math.cos(a);
    // u up the domino, b through it, v across: the domino turns about its far bottom edge
    const at = (u: number, v: number, b: number) => P(t.px - u * s + b * c, v, u * c + b * s);
    const ring = (b: number) => FACE.map((q) => at(q.u, q.v, b));
    // the near face's edges that are inside the outline: where the side beside them is seen
    const side = -cx * s + C.k * c, seen = (q: Sample) => q.nu * side + q.nv * cy > 0;
    put(t.el, {
      sil: poly(hull(ring(0).concat(ring(T)))),
      crease: open(run(FACE, seen).map((q) => at(q.u, q.v, T))) + seg(at(H / 2, -W / 2 + 3, T), at(H / 2, W / 2 - 3, T)),
    });
    let d = "";
    for (const [u, v] of t.spots) {
      const dot: Vec2[] = [];
      for (let k = 0; k < 10; k++) dot.push(at(u + PR * Math.cos(k * Math.PI / 5), v + PR * Math.sin(k * Math.PI / 5), T));
      d += poly(dot);
    }
    t.pips.setAttribute("d", d);
  }

  const sp = spring(REST, { k: value, c: 2 * Math.sqrt(value), eps: 0.002 });
  const B = register(stage, (dt) => {
    const m = stepS(sp, dt);
    const a = clamp(sp.x, 0, N - 0.001), head = Math.floor(a);
    th[head] = (a - head) * (head === N - 1 ? Math.PI / 2 : TOUCH);
    for (let j = head + 1; j < N; j++) th[j] = 0;
    for (let j = head - 1; j >= 0; j--) th[j] = lean(th[j + 1]);
    tiles.forEach((t, j) => {
      draw(t, th[j]);
      if ((j === head) !== t.on) {
        t.on = j === head;
        t.el.sil.classList.toggle("hi", t.on);
        t.pips.setAttribute("class", t.on ? "dot" : "dot m");
      }
    });
    return m;
  });
  bag.add(B.unregister);

  // the row's axis on screen, at half height: it never moves, so neither does the pick
  const A0 = P(0, 0, H / 2), A1 = P(-(N - 1) * D, 0, H / 2), ax = A1[0] - A0[0], ay = A1[1] - A0[1];
  bag.add(pointer(stage, {
    move: (p) => {
      const u = ((p[0] - A0[0]) * ax + (p[1] - A0[1]) * ay) / (ax * ax + ay * ay);
      sp.t = clamp(u * (N - 1) + 0.75, 0, N - 0.02);
      read.textContent = String(Math.floor(sp.t) + 1).padStart(2, "0");
      B.wake();
    },
    leave: () => { sp.t = REST; read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { sp.k = v; sp.c = 2 * Math.sqrt(v); B.wake(); },
    destroy: bag.dispose,
  };
};
