import { Cam, fit, hull, poly, proj, seg, type Vec2 } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, mk, pointer, register, type FigureMount } from "../core/stage";

/**
 * Hourglass: two glass cones between two plates, and sand. The pointer turns
 * it over: once on arriving, and again each time it crosses from one half of
 * the stage to the other. Whatever sand had fallen is now on top, and runs
 * down again in a bright thread, the upper sand sinking as the heap under it
 * grows. Left alone it runs out and stops. The read-out is the time left in
 * the upper glass. The slider is how fast the sand runs.
 *
 * The pattern: a body turned in space. Every line is the hull of circles
 * about the glass's own axis, and the axis is tipped over in the plane that
 * faces the eye. The glass is the same either way up, so a turn is drawn in
 * two halves: the old arrangement tipping away, then the new one coming up.
 */

const RP = 22, TP = 3, HG = 28, RB = 17, RN = 1.8, MID = TP + HG, N = 32, Q = Math.SQRT1_2;

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let run = value;
  const C = Cam(45, 0.5, 2.1);
  fit(C, [[-RP, -RP, 0], [RP, RP, 0], [RP, -RP, 0], [-RP, RP, 0], [0, 0, 2 * MID]], 200, 160);
  const P = proj(C);
  const g = mk("g", {}, svg);

  // where it stands
  const ground: Vec2[] = [];
  for (let i = 0; i < 48; i++) ground.push(P(31 * Math.cos(i * Math.PI / 24), 31 * Math.sin(i * Math.PI / 24), 0));
  mk("path", { class: "nf lo dash", d: poly(ground) }, g);

  // far to near, seen from above the upper plate
  const part = (cls: string) => mk("path", { class: cls }, g);
  const plateLo = part("sil"), capLo = part("nf lo"), bulbLo = part("sil"), heap = part("dot off"), heapLine = part("nf lo"), thread = part("nf hi");
  const bulbHi = part("sil"), sand = part("dot off"), level = part("nf lo"), plateHi = part("sil"), capHi = part("nf lo");

  let tilt = 0;
  /** A point of the glass, measured from its waist, tipped over sideways to the eye. */
  const at = (x: number, y: number, z: number): Vec2 => {
    const n = (x + y) * Q, s = (x - y) * Q, c = Math.cos(tilt), k = Math.sin(tilt), s2 = s * c + z * k;
    return P((n + s2) * Q, (n - s2) * Q, MID - s * k + z * c);
  };
  const ring = (r: number, z: number): Vec2[] => { const o: Vec2[] = []; for (let i = 0; i < N; i++) o.push(at(r * Math.cos(i * 2 * Math.PI / N), r * Math.sin(i * 2 * Math.PI / N), z)); return o; };

  /** How much of the sand is in the upper glass, and the turn still to be made. */
  let f = 0.62, running = false, over = false, side = 0;
  const ang = spring(0, { k: 46, c: 9.5, eps: 0.002 });

  function draw(flowing: boolean) {
    // past half way round, it is still the old arrangement, tipping away
    const old = ang.x > Math.PI / 2, top = old ? 1 - f : f;
    tilt = old ? ang.x - Math.PI : ang.x;
    plateLo.setAttribute("d", poly(hull(ring(RP, -HG - TP).concat(ring(RP, -HG)))));
    capLo.setAttribute("d", poly(ring(RP - 2.2, -HG)));
    bulbLo.setAttribute("d", poly(hull(ring(RB, -HG).concat(ring(RN, 0)))));
    bulbHi.setAttribute("d", poly(hull(ring(RB, HG).concat(ring(RN, 0)))));
    plateHi.setAttribute("d", poly(hull(ring(RP, HG).concat(ring(RP, HG + TP)))));
    capHi.setAttribute("d", poly(ring(RP - 2.2, HG + TP)));
    // the heap below: a cone on the lower plate
    const low = Math.cbrt(Math.max(0, 1 - top)), hp = 15 * low, apex = at(0, 0, -HG + 0.4 + hp);
    if (low > 0.12) {
      const foot = ring((RB - 1.6) * Math.min(1, low * 1.1), -HG + 0.4), d = poly(hull(foot.concat([apex])));
      heap.setAttribute("d", d); heapLine.setAttribute("d", d);
    } else { heap.setAttribute("d", ""); heapLine.setAttribute("d", ""); }
    // the sand above: what fills the upper cone up to its level
    const up = Math.cbrt(Math.max(0, top));
    if (up > 0.12) {
      const h = (HG - 2.5) * up, r = RN + (RB - RN) * h / HG - 1.1, face = ring(r, h);
      sand.setAttribute("d", poly(hull(face.concat(ring(RN * 0.5, 0.6)))));
      level.setAttribute("d", poly(face));
    } else { sand.setAttribute("d", ""); level.setAttribute("d", ""); }
    thread.setAttribute("d", flowing ? seg(at(0, 0, 0.6), apex) : "");
  }

  const B = register(stage, (dt) => {
    const m = stepS(ang, dt);
    // it runs only while it stands
    const flowing = running && f > 0 && Math.abs(ang.x) < 0.3;
    if (flowing) f = Math.max(0, f - dt / run);
    draw(flowing && f > 0);
    if (over) read.textContent = (f * run).toFixed(1) + " s";
    return m || flowing;
  });
  bag.add(B.unregister);
  draw(false);

  function turn() {
    if (Math.abs(ang.x) > 0.6) return;
    f = 1 - f;
    ang.x += Math.PI;
    running = true;
    B.wake();
  }
  bag.add(pointer(stage, {
    move: (p) => {
      const s = p[0] < 200 ? -1 : 1;
      if (!over || s !== side) turn();
      over = true; side = s;
    },
    leave: () => { over = false; read.textContent = "rest"; },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { run = v; }, destroy: bag.dispose };
};
