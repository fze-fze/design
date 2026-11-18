import { Cam, clamp, facing, fit, hull, lerp, poly, proj, rad, seg, type Projector, type Sample, type Vec2 } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";
import { lid, slab } from "../slab";

/**
 * Pencil case: a zip-round case lying flat, the kind that opens like a
 * book. The pointer is the hand on it. Going across from the left it first
 * draws the zip's pull along the front, the pull's tag hanging from it; once
 * the zip is undone, going further lifts the lid on its hinge at the back.
 * Under the lid, the pencils, a pen, a marker and a rubber lie where they
 * were put, held by two straps, and nothing in the case moves by itself.
 * Coming back lowers the lid and does the zip up. The read-out is the zip,
 * then the lid's angle. The slider is how far back the lid goes.
 *
 * The pattern: scrub, in two stages. One number, how far across the hand
 * is, drives two springs in turn. The lid is a slab drawn in its own tilted
 * frame, and shows its outside or its lining, whichever faces the eye.
 */

const L = 112, HW = 20, H = 8, T = 4.5, FLOOR = H - 2.5, ZA = 9, ZB = L - 9, SPLIT = 0.58, REST = 0.84, N = 12;
/** What lies in the case, far to near: across, where it starts, how long, how thick, whether it ends in a point. */
const INSIDE: Array<[number, number, number, number, boolean]> = [[-13, 12, 76, 2, true], [-7.8, 17, 68, 2.4, false], [-2.6, 10, 80, 2, true], [3, 22, 60, 2.7, false], [11.5, 44, 42, 2, true]];

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let back = rad(value);
  const C = Cam(45, 0.5, 2);
  fit(C, [[0, -HW, 0], [L, HW, 0], [L, -HW, 0], [0, HW, 0], [L / 2, -HW - 6, H + 2 * HW * 0.85]], 200, 168);
  const P = proj(C), front = facing(C), e = C.k / Math.sqrt(1 - C.k * C.k) * Math.SQRT2;
  const g = mk("g", {}, svg);

  // the lower half, and what lies in it: drawn once, and never moved
  const [bo, bi] = lid(0, -HW, L, HW, 8, 2.6);
  put(solid(g), slab(P, front, bo, bi, 0, H));
  for (const [y, x0, len, r, point] of INSIDE) {
    const ring = (s: number, q: number): Vec2[] => { const o: Vec2[] = []; for (let i = 0; i < N; i++) o.push(P(x0 + s, y + q * Math.cos(i * 2 * Math.PI / N), FLOOR + r + q * Math.sin(i * 2 * Math.PI / N))); return o; };
    mk("path", { class: "sil", d: poly(hull(ring(0, r).concat(ring(len, r)))) }, g);
    if (point) mk("path", { class: "sil", d: poly(hull(ring(len, r).concat([P(x0 + len + 7, y, FLOOR + r)]))) }, g);
    else mk("path", { class: "nf lo", d: poly(ring(len, r - 0.9)) + poly(ring(len - 9, r)) }, g);
  }
  const [ro, ri] = lid(13, 8, 33, 15.5, 1.6, 0.9);
  put(solid(g), slab(P, front, ro, ri, FLOOR, FLOOR + 4));
  // the two straps over them
  let straps = "";
  for (const x of [36, 39, 72, 75]) straps += seg(P(x, -16.5, FLOOR + 5), P(x, 6.5, FLOOR + 5));
  mk("path", { class: "nf lo", d: straps }, g);

  const top = solid(g), pocket = mk("path", { class: "nf lo" }, g);
  const teeth = mk("path", { class: "nf lo dash" }, g), tag = mk("path", { class: "sil hi" }, g);

  const zip = spring(ZB, { k: 150, c: 22, eps: 0.02 }), ang = spring(0, { k: 80, c: 17, eps: 0.0006 });
  /** How far across the hand is, as the zip's place and the lid's angle. */
  const aim = (p: number) => { zip.t = lerp(ZA, ZB, clamp(p / SPLIT, 0, 1)); ang.t = back * clamp((p - SPLIT) / (1 - SPLIT), 0, 1); };
  let over = false;

  function draw() {
    // the lid's own frame: x along the hinge, v out from it across the lid, w through it
    const c = Math.cos(ang.x), k = Math.sin(ang.x);
    const Q: Projector = (x, v, w) => P(x, -HW + v * c - w * k, H + v * k + w * c);
    const show = (q: Sample) => q.nu + q.nv * (c + e * k) > 0;
    const [lo, li] = lid(0, 0, L, 2 * HW, 8, 2.6), outside = e * c - k > 0;
    put(top, outside ? slab(Q, show, lo, li, 0, T) : slab(Q, show, lo, li, T, 0));
    // the lining has a pocket across it
    pocket.setAttribute("d", outside ? "" : seg(Q(6, 2 * HW * 0.52, 0), Q(L - 6, 2 * HW * 0.52, 0)) + seg(Q(L * 0.5, 2 * HW * 0.52, 0), Q(L * 0.5, 4, 0)));
    // the zip along the front: its teeth where it is still done up, and the pull with its tag hanging
    const x = zip.x, F = (u: number, z: number) => P(u, HW, z);
    teeth.setAttribute("d", x < ZB - 1 ? seg(F(x, H), F(ZB, H)) : "");
    tag.setAttribute("d", poly([F(x - 2.6, H + 1.5), F(x + 2.6, H + 1.5), F(x + 2.6, H - 1.5), F(x + 1.3, H - 1.5), F(x + 1.3, H - 6.6), F(x - 1.3, H - 6.6), F(x - 1.3, H - 1.5), F(x - 2.6, H - 1.5)]));
  }

  const B = register(stage, (dt) => {
    let m = stepS(zip, dt);
    m = stepS(ang, dt) || m;
    draw();
    if (over) read.textContent = ang.x > 0.03 ? "open " + Math.round(ang.x * 180 / Math.PI) + "°" : "zip " + Math.round((zip.x - ZA) / (ZB - ZA) * 100) + "%";
    return m;
  });
  bag.add(B.unregister);
  // nothing swings on mount: it is found left open
  aim(REST); ang.x = ang.t; zip.x = zip.t;
  draw();

  bag.add(pointer(stage, {
    move: (p) => { over = true; aim(clamp((p[0] - 95) / 210, 0, 1)); B.wake(); },
    leave: () => { over = false; aim(REST); read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { back = rad(v); if (!over) aim(REST); B.wake(); }, destroy: bag.dispose };
};
