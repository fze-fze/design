import { Cam, clamp, facing, fit, prism, proj, rings, seg, unproj } from "../core/iso";
import { spring, stepS, type Spring } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount, type Solid } from "../core/stage";
import { lid, slab } from "../slab";

/**
 * Abacus: a suanpan lying flat, seven rods across a beam, one bead above the
 * beam on each rod and four below. A bead counts when it touches the beam:
 * the one above is five, each one below is one, and those are the bright
 * beads. The pointer is a finger on one rod: below the beam it pushes up
 * every bead that is above it, above the beam it pulls the five down. The
 * number the beads spell goes to the read-out. On leaving, the beads slide
 * back to the number they rest on. The slider is how hard they snap.
 *
 * The pattern: one of many, on springs. Each bead is one number, where it
 * sits along its rod; the pick is made on the plane of the beads' tops.
 */

const N = 7, W = 124, D = 72, PITCH = 16, X0 = 14, BEAM = 22, BW = 5.6, BD = 3, Z = 2, TOP = 6, STEP = 6.6;
const RX = (k: number) => X0 + k * PITCH;
/** Where a bead sits: the five, up against the frame or down on the beam; the ones, on the beam or down at the frame. */
const FIVE = (on: boolean) => (on ? BEAM - 2 - BD : 6 + BD);
const ONE = (i: number, on: boolean) => (on ? BEAM + 2 + BD + i * STEP : D - 6 - BD - (3 - i) * STEP);
const RESTS = [0, 0, 3, 1, 4, 1, 6];

type Bead = { el: Solid; sp: Spring; x: number; drawn: number };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.85);
  fit(C, [[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0], [0, 0, TOP]], 200, 164);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the tray, the rods lying in it, then each rod's beads far to near, with the beam between the five and the ones
  const [to, ti] = rings(0, 0, W, D, 6, 2.2);
  put(solid(g), prism(P, front, to, ti, 0, Z));
  let rods = "";
  for (let k = 0; k < N; k++) rods += seg(P(RX(k), 4, Z + 2.6), P(RX(k), D - 4, Z + 2.6));
  mk("path", { class: "nf lo", d: rods }, g);

  const digits = RESTS.slice();
  const bead = (x: number, y: number): Bead => ({ el: solid(g), sp: spring(y, { k: value, c: 2 * Math.sqrt(value) * 0.8, eps: 0.01 }), x, drawn: NaN });
  const fives = RESTS.map((d, k) => bead(RX(k), FIVE(d >= 5)));
  const [bo, bi] = lid(3, BEAM - 1.6, W - 3, BEAM + 1.6, 1.4, 0.5);
  put(solid(g), slab(P, front, bo, bi, Z, TOP - 1));
  const ones = RESTS.map((d, k) => [0, 1, 2, 3].map((i) => bead(RX(k), ONE(i, i < d % 5))));
  const all = fives.concat(ones.flat());

  function draw(b: Bead) {
    if (b.sp.x === b.drawn) return;
    b.drawn = b.sp.x;
    const [ring, inner] = lid(b.x - BW, b.sp.x - BD, b.x + BW, b.sp.x + BD, 2.6, 0.9);
    put(b.el, slab(P, front, ring, inner, Z + 0.6, TOP));
  }
  const B = register(stage, (dt) => {
    let m = false;
    for (const b of all) { m = stepS(b.sp, dt) || m; draw(b); }
    return m;
  });
  bag.add(B.unregister);

  function arrange() {
    digits.forEach((d, k) => {
      fives[k].sp.t = FIVE(d >= 5);
      fives[k].el.sil.classList.toggle("hi", d >= 5);
      ones[k].forEach((b, i) => { b.sp.t = ONE(i, i < d % 5); b.el.sil.classList.toggle("hi", i < d % 5); });
    });
    B.wake();
  }
  arrange();

  let over = false;
  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], TOP), k = clamp(Math.round((x - X0) / PITCH), 0, N - 1), d = digits[k];
      over = true;
      if (y >= -6 && y <= D + 6 && x >= -6 && x <= W + 6) {
        // above the beam the finger pulls the five down once it is past half way; below, it lifts every bead above it
        digits[k] = y < BEAM ? (y > 11 ? 5 : 0) + d % 5 : (d >= 5 ? 5 : 0) + clamp(Math.round((y - BEAM - 4) / 8.4), 0, 4);
      }
      read.textContent = Number(digits.join("")).toLocaleString("en-US");
      arrange();
    },
    leave: () => {
      over = false;
      RESTS.forEach((d, k) => { digits[k] = d; });
      read.textContent = "rest";
      arrange();
    },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { for (const b of all) { b.sp.k = v; b.sp.c = 2 * Math.sqrt(v) * 0.8; } if (over) B.wake(); },
    destroy: bag.dispose,
  };
};
