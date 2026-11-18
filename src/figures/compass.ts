import { Cam, circ, clamp, facing, fit, poly, prism, proj, rings, unproj, type Ring, type Vec2 } from "../core/iso";
import { spring, stepS, type Spring } from "../core/motion";
import { disposer, flatDot, mk, place, pointer, put, register, solid, type FigureMount } from "../core/stage";

/**
 * Compass: a board of compass needles and one magnet. Left alone the magnet
 * sits at the board's near corner and the needles point north, all but the
 * few beside it. The pointer carries the magnet over the board, and every
 * needle within its reach swings round to point at it, overshoots, and
 * settles, as a needle on a pin does; the ones further off only lean. The
 * needle nearest the magnet is bright. The slider is the magnet's reach.
 *
 * The pattern: a field. Each needle is one angle on a loose spring, and its
 * target is a blend of north and the bearing of the magnet, by distance.
 */

const W = 124, D = 84, TOP = 3, NX = 7, NY = 5, PX = 17, PY = 16, X0 = 11, Y0 = 10, HOME: Vec2 = [W - 12, D - 11];
/** North is the far corner: straight up the page. */
const NORTH = Math.atan2(-1, -1);
const wrap = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const CARD = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

type Needle = { x: number; y: number; el: SVGPathElement; a: Spring; drawn: number };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let reach = value;
  const C = Cam(45, 0.5, 1.85);
  fit(C, [[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0], [0, 0, TOP + 5]], 200, 164);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const [bo, bi] = rings(0, 0, W, D, 7, 2.2);
  put(solid(g), prism(P, front, bo, bi, 0, TOP));

  const needles: Needle[] = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const x = X0 + i * PX, y = Y0 + j * PY;
    const el = mk("path", { class: "sil" }, g);
    place(flatDot(g, C, 0.55, "dot m"), P(x, y, TOP));
    needles.push({ x, y, el, a: spring(NORTH, { k: 70, c: 5.5, eps: 0.002 }), drawn: NaN });
  }
  function draw(n: Needle) {
    if (n.a.x === n.drawn) return;
    n.drawn = n.a.x;
    // a dart: a long point toward what it seeks, a short tail behind
    const c = Math.cos(n.a.x), s = Math.sin(n.a.x), at = (f: number, side: number): Vec2 => P(n.x + c * f - s * side, n.y + s * f + c * side, TOP);
    n.el.setAttribute("d", poly([at(8.4, 0), at(-1.4, 2.7), at(-4.6, 0), at(-1.4, -2.7)]));
  }

  // the magnet, over the needles
  const puck = solid(g), disc = (x: number, y: number, r: number): Ring => circ(r, 28).map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  puck.sil.classList.add("hi");
  const mx = spring(HOME[0], { k: 160, c: 22, eps: 0.02 }), my = spring(HOME[1], { k: 160, c: 22, eps: 0.02 });
  let lit: Needle | null = null, over = false;

  function aim() {
    let best: Needle | null = null, near = 1e9;
    for (const n of needles) {
      const dx = mx.x - n.x, dy = my.x - n.y, d = Math.hypot(dx, dy), pull = d < 0.5 ? 0 : Math.exp(-(d * d) / (reach * reach));
      n.a.t = n.a.x + wrap(NORTH + wrap(Math.atan2(dy, dx) - NORTH) * pull - n.a.x);
      if (d < near) { near = d; best = n; }
    }
    if (best !== lit) { lit?.el.classList.remove("hi"); best?.el.classList.add("hi"); lit = best; }
    if (over) {
      // the magnet's bearing from the middle of the board, clockwise from north
      const b = ((wrap(Math.atan2(my.x - D / 2, mx.x - W / 2) - NORTH) * 180 / Math.PI) + 360) % 360;
      read.textContent = `${CARD[Math.round(b / 45) % 8]} ${Math.round(b)}°`;
    }
  }

  const B = register(stage, (dt) => {
    let m = stepS(mx, dt);
    m = stepS(my, dt) || m;
    put(puck, prism(P, front, disc(mx.x, my.x, 5.2), disc(mx.x, my.x, 3.4), TOP + 1.5, TOP + 4.5));
    aim();
    for (const n of needles) { m = stepS(n.a, dt) || m; draw(n); }
    return m;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], TOP + 3);
      over = true;
      mx.t = clamp(x, 4, W - 4); my.t = clamp(y, 4, D - 4);
      B.wake();
    },
    leave: () => { over = false; mx.t = HOME[0]; my.t = HOME[1]; read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
};
