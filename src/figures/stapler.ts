import { Cam, clamp, facing, fit, proj, rad, seg, unproj, type Projector, type Sample } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";
import { lid, slab } from "../slab";

/**
 * Stapler: a stapler with its jaw open and a strip of paper running through under it. The
 * pointer draws the sheet through, and each time the sheet has moved on by
 * one stitch the arm snaps down and springs back, leaving a staple behind;
 * the bright row of staples follows the paper out from under the jaw. The
 * read-out counts them. On leaving, the sheet goes back to how it was found,
 * with three in it. The slider is how close the stitches are.
 *
 * The pattern: a trail. One spring moves the paper, one swings the arm about
 * its hinge, and the arm is a slab drawn in its own tilted frame.
 */

const L = 92, HW = 9, BASE = 3, AL = 86, AW = 7, AT = 9, HX = 4, HZ = 5.4, OPEN = rad(12), PX0 = 50, PX1 = 85, PH = 50, SX = 75, SHEET = 0.7, HOME = -4;
const FOUND = [14, 23, 32];

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let pitch = value;
  const C = Cam(45, 0.5, 2.1);
  fit(C, [[0, -HW, 0], [L, HW, 0], [PX1, HOME - PH, 0], [PX1, PH + HOME, 0], [PX0, PH + HOME, 0], [PX0, HOME - PH, 0], [HX + AL, 0, HZ + AL * Math.sin(OPEN) + AT]], 200, 164);
  const P = proj(C), front = facing(C), e = C.k / Math.sqrt(1 - C.k * C.k) * Math.SQRT2;
  const g = mk("g", {}, svg);

  // the base and the block the arm is hinged on
  const [bo, bi] = lid(0, -HW, L, HW, 6, 1.4);
  put(solid(g), slab(P, front, bo, bi, 0, BASE));
  const [ho, hi] = lid(0, -AW, 11, AW, 3, 0.9);
  put(solid(g), slab(P, front, ho, hi, BASE, HZ));

  // the sheet, what is written on it, and the staples in it
  const sheet = solid(g), text = mk("path", { class: "nf lo" }, g), row = mk("path", { class: "nf hi" }, g);
  const arm = solid(g), pad = solid(g);

  const off = spring(HOME, { k: 120, c: 20, eps: 0.02 }), th = spring(OPEN, { k: 900, c: 34, eps: 0.0005 });
  let staples = FOUND.slice(), last = HOME, pending = false, over = false, drawnOff = NaN, drawnTh = NaN, dirty = true;

  function draw() {
    if (off.x !== drawnOff || dirty) {
      drawnOff = off.x; dirty = false;
      const [po] = lid(PX0, off.x - PH, PX1, off.x + PH, 2.5, 0.5), top = BASE + SHEET;
      put(sheet, slab(P, front, po, null, BASE, top));
      let t = "", s = "";
      for (let i = 0; i < 9; i++) { const y = off.x - 36 + i * 9; t += seg(P(55, y, top), P(55 + [9, 6, 10, 5, 8, 10, 6, 9, 5][i], y, top)); }
      for (const v of staples) s += seg(P(SX, off.x + v - 2.6, top), P(SX, off.x + v + 2.6, top));
      text.setAttribute("d", t); row.setAttribute("d", s);
    }
    if (th.x !== drawnTh) {
      drawnTh = th.x;
      // the arm's own frame: x along it from the hinge, z through it
      const c = Math.cos(th.x), k = Math.sin(th.x);
      const A: Projector = (x, y, z) => P(HX + x * c - z * k, y, HZ + x * k + z * c);
      const show = (q: Sample) => q.nu * (c + e * k) + q.nv > 0;
      const [ao, ai] = lid(0, -AW, AL, AW, 5, 1.3), [to, ti] = lid(AL - 32, -4.4, AL - 7, 4.4, 3.4, 0.9);
      put(arm, slab(A, show, ao, ai, 0, AT));
      put(pad, slab(A, show, to, ti, AT, AT + 1.1));
    }
  }

  const B = register(stage, (dt) => {
    let m = stepS(off, dt);
    m = stepS(th, dt) || m;
    // one stitch on: down it comes
    if (over && !pending && Math.abs(off.x - last) >= pitch) { last = off.x; pending = true; th.t = 0; m = true; }
    if (pending && th.x < 0.035) {
      pending = false; th.t = OPEN; m = true;
      staples = staples.concat(-off.x).filter((v) => Math.abs(v) < PH - 3).slice(-9);
      dirty = true;
      read.textContent = staples.length + " staples";
    }
    draw();
    return m || pending;
  });
  bag.add(B.unregister);
  draw();

  bag.add(pointer(stage, {
    move: (p) => {
      const y = unproj(C, p[0], p[1], BASE)[1];
      if (!over) { over = true; staples = []; dirty = true; last = off.x; pending = true; th.t = 0; read.textContent = "0 staples"; }
      off.t = clamp(y, -24, 16);
      B.wake();
    },
    leave: () => {
      over = false; pending = false;
      off.t = HOME; th.t = OPEN; last = HOME;
      staples = FOUND.slice(); dirty = true;
      read.textContent = "rest";
      B.wake();
    },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { pitch = v; }, destroy: bag.dispose };
};
