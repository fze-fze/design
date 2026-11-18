import { Cam, clamp, facing, fit, prism, proj, r2, rad, rings, seg, type Vec2 } from "../core/iso";
import { reducedMotion } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";

/**
 * Cradle: Newton's cradle. Five balls hang in a row from two rails, each on a
 * pair of strings. Left alone it clacks gently: one end ball swings out, lands,
 * and the far one leaves. The pointer takes the end ball on its side and draws
 * it out, the further from the middle the higher; let go, and the swing it
 * was given runs down to the gentle one. The ball that is out is the bright
 * one, so the mark passes from end to end with each clack. The slider is how
 * far a ball can be drawn out.
 *
 * The pattern: ambient, with a hand in it. One number, the angle: below zero
 * the left ball is out, above it the right one. Held, it follows the pointer
 * on the default spring; free, it is a pendulum whose energy is steered back
 * to the resting swing.
 */

const R = 9, NB = 5, L = 58, HB = 80, W = 20, X = 2 * 2 * R + R + 12;
/** The resting swing, and the pendulum's rate: a clack every three quarters of a second. */
const A0 = rad(14), W2 = (2 * Math.PI / 1.5) ** 2, REACH = 75;

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let max = rad(value), held: number | null = null, q = -A0, v = 0;
  const C = Cam(45, 0.5, 1.45);
  const far = 2 * 2 * R + L * Math.sin(rad(58)), up = HB - L * Math.cos(rad(58));
  fit(C, [[-X - 8, -W - 8, -5], [X + 8, -W - 8, -5], [X + 8, W + 8, -5], [-X - 8, W + 8, -5], [-X, -W, HB + 4], [X, -W, HB + 4], [-far, 0, up], [far, 0, up]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const block = (x0: number, y0: number, x1: number, y1: number, r: number, z0: number, z1: number) => {
    const [o, i] = rings(x0, y0, x1, y1, r, 0.7);
    put(solid(g), prism(P, front, o, i, z0, z1));
  };
  const posts = (y: number) => { for (const x of [-X, X]) block(x - 2, y - 2, x + 2, y + 2, 1.5, 0, HB); };
  const rail = (y: number) => block(-X - 3, y - 2.4, X + 3, y + 2.4, 2.2, HB, HB + 4);

  // Back to front: the plinth, the far posts, the far strings and the rail that hides their ends, the balls, then the same in front.
  block(-X - 8, -W - 8, X + 8, W + 8, 8, -5, 0);
  posts(-W);
  const back = mk("path", { class: "nf" }, g);
  rail(-W);
  const rs = r2(R * C.S), hs = rs * 0.66;
  const balls = Array.from({ length: NB }, () => {
    const b = mk("g", {}, g);
    const sil = mk("ellipse", { rx: rs, ry: rs, class: "sil" }, b);
    // one dim line inside: the turn of the sphere, up and to the left
    mk("path", { class: "nf lo", d: `M${r2(-hs)} ${r2(-hs * 0.18)}A${r2(hs)} ${r2(hs)} 0 0 1 ${r2(hs * 0.3)} ${r2(-hs * 0.95)}` }, b);
    return { b, sil };
  });
  const fore = mk("path", { class: "nf" }, g);
  posts(W);
  rail(W);

  let drawn = NaN, lit = -1;
  function draw() {
    if (q === drawn) return;
    drawn = q;
    let sb = "", sf = "";
    balls.forEach(({ b }, i) => {
      const a = i === 0 ? Math.min(q, 0) : i === NB - 1 ? Math.max(q, 0) : 0, x = (i - 2) * 2 * R;
      const at = (l: number): Vec2 => P(x + l * Math.sin(a), 0, HB - l * Math.cos(a)), c = at(L), top = at(L - R);
      b.setAttribute("transform", `translate(${r2(c[0])} ${r2(c[1])})`);
      sb += seg(top, P(x, -W, HB));
      sf += seg(top, P(x, W, HB));
    });
    back.setAttribute("d", sb);
    fore.setAttribute("d", sf);
    const on = q < 0 ? 0 : NB - 1;
    if (on !== lit) { lit = on; balls.forEach(({ sil }, i) => sil.classList.toggle("hi", i === on)); }
  }

  const B = register(stage, (dt) => {
    if (reducedMotion()) { q = held ?? -A0; v = 0; draw(); return false; }
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      v += (held === null ? -W2 * Math.sin(q) : -100 * (q - held) - 18 * v) * h;
      q += v * h;
    }
    if (held === null) {
      // steer the swing's energy to the resting one: a big swing runs down, a still cradle starts
      const E = v * v / 2 + W2 * (1 - Math.cos(q)), E0 = W2 * (1 - Math.cos(A0));
      if (E > E0 * 1.02) v *= Math.exp(-0.9 * dt);
      else if (E < E0 * 0.98) v = Math.abs(v) < 0.05 && Math.abs(q) < 0.02 ? 0.3 : v * Math.exp(1.2 * dt);
    }
    draw();
    return true;
  });
  bag.add(B.unregister);

  // the pointer along the row, in world units, read on the screen direction of the row: it never moves
  const O = P(0, 0, HB - L), E1 = P(1, 0, HB - L), ex = E1[0] - O[0], ey = E1[1] - O[1], ee = ex * ex + ey * ey;
  let along = 0;
  const hold = () => {
    held = clamp(along / REACH, -1, 1) * max;
    read.textContent = `pull ${Math.round(Math.abs(held) * 180 / Math.PI)}°`;
    B.wake();
  };
  bag.add(pointer(stage, {
    move: (p) => { along = ((p[0] - O[0]) * ex + (p[1] - O[1]) * ey) / ee; hold(); },
    leave: () => { held = null; read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (x) => { max = rad(x); if (held !== null) hold(); }, destroy: bag.dispose };
};
