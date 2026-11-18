import { Cam, clamp, facing, fit, prism, proj, rings, seg, unproj } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, flatDot, mk, place, pointer, put, register, solid, type FigureMount } from "../core/stage";

/**
 * Faders: a mixing desk of eight channels. The pointer takes the fader of the
 * channel it is over and sets it by how far up the slot it is; the faders
 * beside it follow part of the way, less the further off, each on its own
 * spring. At rest they hold a curve, and the highest is bright. Under each
 * slot a lamp says which channel is held. The slider is how many channels
 * the move reaches.
 *
 * The pattern: a field, scrubbed. The pick and the level are both read on
 * one fixed plane through the caps' middle, never from a cap on screen.
 */

const N = 8, DX = 16, LEN = 64, CW = 11, CD = 7, CH = 8, TOP = 6;
const REST = [0.62, 0.4, 0.3, 0.46, 0.7, 0.82, 0.58, 0.34], MARK = 5;
/** The share of the move a fader d channels off takes, with a reach of r channels. */
const share = (d: number, r: number) => (d === 0 ? 1 : 0.85 * clamp(1 - d / (r + 0.5), 0, 1) ** 1.5);

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.85);
  const X0 = -13, X1 = (N - 1) * DX + 13, Y0 = -12, Y1 = LEN + 20;
  fit(C, [[X0, Y0, 0], [X1, Y0, 0], [X1, Y1, 0], [X0, Y1, 0], [X0, Y0, TOP + CH]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const [po, pi] = rings(X0, Y0, X1, Y1, 9, 2.2);
  put(solid(g), prism(P, front, po, pi, 0, TOP));
  // the slots, then a lamp under each
  mk("path", { class: "nf", d: REST.map((_, i) => seg(P(i * DX, -2, TOP), P(i * DX, LEN + 2, TOP))).join("") }, g);
  const lamps = REST.map((_, i) => { const d = flatDot(g, C, 1.1, "dot off"); place(d, P(i * DX, LEN + 12, TOP)); return d; });
  // the caps, left to right: the one to the right is always the nearer
  const caps = REST.map(() => solid(g));
  const sp = REST.map((l) => spring(l, { eps: 0.001 })), drawn = REST.map(() => NaN);

  function draw() {
    sp.forEach((s, i) => {
      const l = clamp(s.x, 0, 1);
      if (l === drawn[i]) return;
      drawn[i] = l;
      const x = i * DX, y = LEN * (1 - l), z = TOP + CH;
      const [o, n] = rings(x - CW / 2, y - CD / 2, x + CW / 2, y + CD / 2, 1.8, 0.8), s0 = prism(P, front, o, n, TOP, z);
      // the line a cap carries across its top
      put(caps[i], { sil: s0.sil, crease: s0.crease + seg(P(x - CW / 2 + 1.6, y, z), P(x + CW / 2 - 1.6, y, z)) });
    });
  }

  const B = register(stage, (dt) => { let m = false; for (const s of sp) m = stepS(s, dt) || m; draw(); return m; });
  bag.add(B.unregister);

  let reach = value, held = -1, level = 0, lit = -2;
  function retarget() {
    sp.forEach((s, i) => { s.t = held < 0 ? REST[i] : REST[i] + (level - REST[i]) * share(Math.abs(i - held), reach); });
    const on = held < 0 ? MARK : held;
    if (on !== lit) {
      lit = on;
      caps.forEach((c, i) => c.sil.classList.toggle("hi", i === on));
      lamps.forEach((d, i) => d.setAttribute("class", i === held ? "dot" : "dot off"));
    }
    read.textContent = held < 0 ? "rest" : `ch ${held + 1} · ${Math.round(level * 100)}`;
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], TOP + CH / 2);
      held = clamp(Math.round(x / DX), 0, N - 1);
      level = clamp(1 - y / LEN, 0, 1);
      retarget();
    },
    leave: () => { held = -1; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; if (held >= 0) retarget(); }, destroy: bag.dispose };
};
