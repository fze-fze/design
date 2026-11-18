import { Cam, circ, clamp, facing, fillet, fit, hull, poly, prism, proj, ringAt, rings, seg, type Ring, type Vec2 } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";
import { TABLE } from "../intensity";

/**
 * Desk: a standing desk on two telescoping legs, with what a desk carries: a
 * lamp, a monitor on its stand, a keyboard, a mug. The pointer's height
 * raises and lowers the top, on a spring; the columns slide out of their
 * sleeves and everything on the top rides with it. The top is the bright
 * mark, and its height goes to the read-out. The slider is how far it travels.
 *
 * The pattern: scrub. One spring on one number, the top's height; the pick
 * is the pointer's height on the stage, which never moves.
 */

const TW = 110, TD = 56, TT = 3, H0 = 46, SLEEVE = 40, REST = 0.35;
const disc = (cx: number, cy: number, r: number, n = 28): Ring => circ(r, n).map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));
/** The monitor's panel and its bezel, in the panel's own plane: x along the desk, z above the top. */
const PANEL = /* @__PURE__ */ fillet([[80, 9], [80, 41], [30, 41], [30, 9]], [2.5, 2.5, 2.5, 2.5]);
const BEZEL = /* @__PURE__ */ fillet([[77.8, 11.2], [77.8, 38.8], [32.2, 38.8], [32.2, 11.2]], [1.2, 1.2, 1.2, 1.2]);

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let travel = value;
  const TOP = H0 + TABLE.desk[2] + 42;
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[4, 2, 0], [TW - 4, 2, 0], [TW - 4, TD - 2, 0], [4, TD - 2, 0], [0, 0, H0], [TW, TD, H0], [30, 13, TOP], [80, 13, TOP]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const part = () => solid(g);
  const box = (x0: number, y0: number, x1: number, y1: number, r: number, b: number) => rings(x0, y0, x1, y1, r, b);

  // Back to front. Each leg: its foot, the column, then the sleeve the column slides in, which hides its lower end.
  const cols = [14, TW - 14].map((x) => {
    const [fo, fi] = box(x - 4, 4, x + 4, TD - 4, 2.5, 0.9);
    put(part(), prism(P, front, fo, fi, 0, 3));
    const el = part(), ring = box(x - 2.2, TD / 2 - 2.2, x + 2.2, TD / 2 + 2.2, 1.2, 0.5);
    const [so, si] = box(x - 3.4, TD / 2 - 3.4, x + 3.4, TD / 2 + 3.4, 1.6, 0.7);
    put(part(), prism(P, front, so, si, 3, SLEEVE));
    return { el, ring };
  });
  // The top, and what stands on it, each behind the next: lamp foot and post, monitor, the lamp's arm and shade, keyboard, mug.
  const top = part(), TOPR = box(0, 0, TW, TD, 4, 1.4);
  top.sil.classList.add("hi");
  const lampFoot = part(), lampPost = part(), monFoot = part(), monNeck = part(), panel = part();
  const arm = mk("path", { class: "nf sil" }, g), shade = part(), keys = part(), mug = part();
  const R = {
    lampFoot: [disc(14, 14, 6), disc(14, 14, 4.8)], lampPost: box(13, 13, 15, 15, 0.8, 0.3),
    monFoot: box(46, 9, 64, 20, 3, 0.9), monNeck: box(53, 11, 57, 13.4, 1, 0.4),
    keys: box(36, 32, 80, 46, 2, 0.8), mug: [disc(94, 36, 5), disc(94, 36, 3.9)],
    shadeTop: disc(28, 25, 2.4, 20), shadeRim: disc(28, 25, 6.6, 28),
  };

  const sp = spring(H0 + REST * travel, { eps: 0.02 });
  let drawn = NaN;
  function draw(h: number) {
    if (h === drawn) return;
    drawn = h;
    const up = (el: ReturnType<typeof part>, r: Ring[], z0: number, z1: number) => put(el, prism(P, front, r[0], r[1], h + z0, h + z1));
    for (const c of cols) put(c.el, prism(P, front, c.ring[0], c.ring[1], 3, h - TT));
    up(top, TOPR, -TT, 0);
    up(lampFoot, R.lampFoot, 0, 1.5);
    up(lampPost, R.lampPost, 1.5, 24);
    up(monFoot, R.monFoot, 0, 1.2);
    up(monNeck, R.monNeck, 1.2, 14);
    // a thin panel: its outline, and the bezel on the face that looks at the chair
    const face = (pts: Vec2[], y: number) => pts.map(([x, z]) => P(x, y, h + z));
    put(panel, { sil: poly(hull(face(PANEL, 13).concat(face(PANEL, 15.4)))), crease: poly(face(BEZEL, 15.4)) });
    arm.setAttribute("d", seg(P(14, 14, h + 24), P(27, 24, h + 32)));
    put(shade, { sil: poly(hull(ringAt(P, R.shadeTop, h + 32.5).concat(ringAt(P, R.shadeRim, h + 26)))), crease: "" });
    up(keys, R.keys, 0, 1.6);
    up(mug, R.mug, 0, 9);
  }

  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(sp.x); return m; });
  bag.add(B.unregister);

  let lift: number | null = null;
  const retarget = () => {
    sp.t = H0 + (lift ?? REST) * travel;
    // a sitting desk is about 70 cm, and each unit here is near enough a centimetre and a half
    read.textContent = lift === null ? "rest" : `${Math.round(68 + (sp.t - H0) * 1.5)} cm`;
    B.wake();
  };
  bag.add(pointer(stage, {
    move: (p) => { lift = clamp((235 - p[1]) / 140, 0, 1); retarget(); },
    leave: () => { lift = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { travel = v; retarget(); }, destroy: bag.dispose };
};
