import { Cam, clamp, facing, fillet, fit, hull, lerp, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg, type Vec2 } from "../core/iso";
import { reducedMotion, spring, stepS } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";

/**
 * Metronome: a tapered case on a plinth, and on its face an arm that swings
 * about a pivot near the foot, a weight riding on it. It keeps time on its
 * own. The pointer's height slides the weight along the arm, on a spring:
 * higher is slower, as on a real one, and the tempo goes to the read-out.
 * The weight is the bright mark. The slider is how wide the arm swings.
 *
 * The pattern: ambient, scrubbed. A phase that advances at the tempo, and a
 * spring on where the weight sits; the pick is read on the arm's fixed
 * upright, never on the arm as it swings.
 */

const HB = 80, FX = 19, FY = 15, TX = 7, TY = 6, ZP = 14, LA = 78, W0 = 0.3, W1 = 0.85, WR = 0.55;
/** The face that carries the arm: its y, and its half width, at height z. */
const fy = (z: number) => lerp(FY, TY, z / HB) + 0.01, hx = (z: number) => lerp(FX, TX, z / HB);
/** Up the face, in world: the face leans back as the case tapers. */
const VN = Math.hypot(FY - TY, HB), VY = -(FY - TY) / VN, VZ = HB / VN;
const bpm = (w: number) => Math.round(lerp(184, 48, (w - W0) / (W1 - W0)));

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let amp = rad(value), over = false, phase = 0.9;
  const C = Cam(45, 0.5, 2.05);
  const reach = LA * Math.sin(rad(34));
  fit(C, [[-24, -20, -5], [24, -20, -5], [24, 20, -5], [-24, 20, -5], [-reach, TY, ZP + LA], [reach, TY, ZP + LA], [0, 0, HB]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const [po, pi] = rings(-24, -20, 24, 20, 7, 1.8);
  put(solid(g), prism(P, front, po, pi, -5, 0));
  // the case: a foot and a smaller top, joined by their hull, with the top's near edge for a crease
  const foot = rrect(-FX, -FY, FX, FY, 5, 6), top = rrect(-TX, -TY, TX, TY, 2.5, 6), inner = rrect(-TX + 1.4, -TY + 1.4, TX - 1.4, TY - 1.4, 1.2, 6);
  put(solid(g), { sil: poly(hull(ringAt(P, foot, 0).concat(ringAt(P, top, HB)))), crease: open(ringAt(P, run(inner, front), HB)) });
  // on the face: a recess, and the scale's marks down its left side
  const F = (x: number, z: number) => P(x, fy(z), z);
  const win = fillet([[-0.52 * hx(8), 8], [0.52 * hx(8), 8], [0.52 * hx(68), 68], [-0.52 * hx(68), 68]] as Vec2[], [2, 2, 2, 2]);
  mk("path", { class: "nf lo", d: poly(win.map(([x, z]) => F(x, z))) }, g);
  mk("path", { class: "nf lo", d: [24, 32, 40, 48, 56].map((z) => seg(F(-0.52 * hx(z) + 1.6, z), F(-0.52 * hx(z) + 4.6, z))).join("") }, g);

  // a point of the arm's plane: u across the arm, v along it, turned by a about the pivot
  const at = (u: number, v: number, a: number): Vec2 => {
    const s = Math.sin(a), c = Math.cos(a), x = u * c + v * s, w = v * c - u * s;
    return P(x, fy(ZP) + w * VY, ZP + w * VZ);
  };
  const arm = mk("path", { class: "nf sil" }, g);
  const weight = mk("path", { class: "sil hi" }, g);
  const pivot: Vec2[] = [];
  for (let k = 0; k < 12; k++) pivot.push(at(1.5 * Math.cos(k * Math.PI / 6), 1.5 * Math.sin(k * Math.PI / 6), 0));
  mk("path", { class: "dot m", d: poly(pivot) }, g);

  const sp = spring(WR, { eps: 0.001 });
  let da = NaN, dw = NaN;
  function draw(a: number) {
    if (a === da && sp.x === dw) return;
    da = a; dw = sp.x;
    arm.setAttribute("d", seg(at(0, 0, a), at(0, LA, a)));
    const v = sp.x * LA;
    weight.setAttribute("d", poly(rrect(-5.5, v - 4, 5.5, v + 4, 1.6, 4).map((q) => at(q.u, q.v, a))));
  }

  const B = register(stage, (dt) => {
    const m = stepS(sp, dt);
    if (reducedMotion()) { draw(amp * 0.6); return m; }
    // one beat is one swing across, so a full cycle is two
    phase += dt * 2 * Math.PI * bpm(sp.x) / 120;
    draw(amp * Math.sin(phase));
    if (over) read.textContent = bpm(sp.t) + " bpm";
    return true;
  });
  bag.add(B.unregister);

  // the weight's travel on the arm standing upright: two fixed heights on screen
  const y0 = at(0, W0 * LA, 0)[1], y1 = at(0, W1 * LA, 0)[1];
  bag.add(pointer(stage, {
    move: (p) => {
      over = true;
      sp.t = clamp(lerp(W0, W1, (p[1] - y0) / (y1 - y0)), W0, W1);
      read.textContent = bpm(sp.t) + " bpm";
      B.wake();
    },
    leave: () => { over = false; sp.t = WR; read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { amp = rad(v); B.wake(); }, destroy: bag.dispose };
};
