import { Cam, clamp, fillet, fit, lerp, poly, prism, proj, rad, rings, seg, type Projector, type Sample, type Vec2, type Vec3 } from "../core/iso";
import { reducedMotion, spring, stepS, type Spring } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount, type Solid } from "../core/stage";
import { lid, slab } from "../slab";

/**
 * Desktop: a display standing on its edge, leaning back a little, and in
 * use. Over it the page's own cursor becomes the desktop's: a soft dart lying
 * in the plane of the glass. Along the bottom is a dock whose icons swell
 * toward you as the cursor passes over them; the
 * icon under it launches its app, and the window grows out of the icon and
 * comes forward, off the glass, to the front of the pile. The app that fell
 * off the back of the pile shrinks into its icon again. Each app is told by
 * what its window holds: lines of a note, a photo's ridge, a player's bars,
 * a folder's grid, a list of mail. Pointing at a window that is open brings
 * it forward. The front window is bright. The slider is how many stay open.
 *
 * The pattern: one of many, on springs. Everything on the display is laid
 * out in the glass's own frame (x across, y down from the top edge, z out
 * toward the eye) and one projector stands that frame up in the world.
 * Windows are picked on one fixed plane, so the one that comes forward does
 * not leave the pointer.
 */

const W = 120, D = 76, T = 1.4, BASE = 3, GAP = 5, DT = 1.4, Z0 = 0, LEAN = rad(8), TURN = rad(24);
const SL = Math.sin(LEAN), CL = Math.cos(LEAN), ST = Math.sin(TURN), CT = Math.cos(TURN);
const NAMES = ["notes", "photos", "music", "files", "mail"];
/** Each app's window where it opens: x0, y0, x1, y1. */
const WIN = [[12, 13, 58, 46], [34, 18, 88, 52], [66, 12, 116, 42], [24, 22, 74, 54], [56, 20, 112, 54]];
/** Its icon's centre along the dock, and the icons' row. */
const IX = (k: number) => 34 + k * 13, IY = 65, IH = 4;
/** What is open at rest, back to front. */
const REST = [0, 4, 1];
/** A cursor, in the glass's plane, from its tip: a soft dart, every corner rounded. */
const ARROW = /* @__PURE__ */ fillet([[0, 0], [0, 10.5], [3, 7.9], [7.6, 7.4]], [0.7, 1.3, 1.5, 1.3], 6);
const BARS = [0.12, 0.3, 0.2, 0.42, 0.26, 0.36, 0.16, 0.28, 0.1];
/** The glass's frame in the world: the display stands on its lower edge, leans away from the eye, and is turned part of the way round to face it. */
const world = (x: number, y: number, z: number): Vec3 => {
  const out = -(D - y) * SL + z * CL;
  return [x * CT + out * ST, -x * ST + out * CT, Z0 + (D - y) * CL + z * SL];
};

type Seg = [number, number, number, number];
/** A box about a point, and a ring about one, as strokes. */
const box = (u: number, v: number, a: number, b: number): Seg[] => [[u - a, v - b, u + a, v - b], [u + a, v - b, u + a, v + b], [u + a, v + b, u - a, v + b], [u - a, v + b, u - a, v - b]];
const round = (u: number, v: number, a: number, b: number): Seg[] => Array.from({ length: 10 }, (_, i): Seg => {
  const p = i * Math.PI / 5, q = (i + 1) * Math.PI / 5;
  return [u + a * Math.cos(p), v + b * Math.sin(p), u + a * Math.cos(q), v + b * Math.sin(q)];
});
/** What a window holds, as strokes in the window's own unit square, under its title bar. */
function holds(k: number, beat: number): Seg[] {
  // a note: a heading, a checklist, and the caret after the last line
  if (k === 0) return [[0.12, 0.36, 0.5, 0.36], ...[0.52, 0.66, 0.8].flatMap((v): Seg[] => [...box(0.15, v, 0.03, 0.045), [0.24, v, v > 0.7 ? 0.52 : v > 0.6 ? 0.8 : 0.68, v]]), [0.56, 0.76, 0.56, 0.84]];
  // a photo: its frame, a ridge, and the sun
  if (k === 1) return [...box(0.5, 0.6, 0.42, 0.3), [0.08, 0.86, 0.34, 0.5], [0.34, 0.5, 0.48, 0.7], [0.48, 0.7, 0.66, 0.42], [0.66, 0.42, 0.92, 0.84], ...round(0.22, 0.44, 0.045, 0.07)];
  // a player: the bars, and under them how far through the song it is
  if (k === 2) return [...BARS.map((b, i): Seg => {
    const h = b * 0.8 * (beat < 0 ? 1 : 0.55 + 0.6 * Math.sin(beat * 6 + i * 1.3)), u = 0.14 + i * 0.09;
    return [u, 0.52 - h, u, 0.52 + h];
  }), [0.12, 0.88, 0.88, 0.88], ...round(beat < 0 ? 0.38 : 0.12 + 0.76 * (beat / 24 % 1), 0.88, 0.022, 0.04)];
  // a folder: a sidebar, and files with their names under them
  if (k === 3) return [[0.26, 0.22, 0.26, 1], [0.07, 0.38, 0.19, 0.38], [0.07, 0.52, 0.16, 0.52], [0.07, 0.66, 0.19, 0.66], ...[0.4, 0.61, 0.82].flatMap((u) => [0.42, 0.74].flatMap((v): Seg[] => [...box(u, v, 0.065, 0.085), [u - 0.05, v + 0.14, u + 0.05, v + 0.14]]))];
  // mail: a list of senders on the left, the open letter on the right
  return [[0.36, 0.22, 0.36, 1], ...[0.38, 0.56, 0.74, 0.9].flatMap((v): Seg[] => [...round(0.08, v, 0.022, 0.035), [0.14, v, 0.3, v]]), [0.44, 0.38, 0.7, 0.38], [0.44, 0.54, 0.9, 0.54], [0.44, 0.66, 0.84, 0.66], [0.44, 0.78, 0.9, 0.78], [0.44, 0.9, 0.62, 0.9]];
}

type Win = { k: number; el: Solid; marks: SVGPathElement; dots: SVGPathElement[]; s: Spring; z: Spring; at: number };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.95);
  fit(C, [world(0, 0, -4), world(W, 0, -4), world(0, D, -4), world(W, D, -4), world(0, 0, BASE + 2 * GAP + T), world(0, D, BASE + 2 * GAP + T), world(W, D, BASE + 2 * GAP + T)], 200, 162);
  const P = proj(C);
  /** The glass's frame, projected. */
  const Q: Projector = (x, y, z) => { const w = world(x, y, z); return P(w[0], w[1], w[2]); };
  // which of a footprint's sides show: the eye is along (1, 1, e) in the world, and a side's normal lies in the glass
  const e = C.k / Math.sqrt(1 - C.k * C.k) * Math.SQRT2;
  const front = (q: Sample) => q.nu * (CT - ST) + q.nv * ((ST + CT) * SL - CL * e) > 0;
  // the way back from the stage to the glass, at one distance off it
  const o = Q(0, 0, 0), ax = Q(1, 0, 0), ay = Q(0, 1, 0), az = Q(0, 0, 1);
  const a = [ax[0] - o[0], ax[1] - o[1]], b = [ay[0] - o[0], ay[1] - o[1]], det = a[0] * b[1] - a[1] * b[0];
  const back = (sx: number, sy: number, z: number): Vec2 => {
    const px = sx - o[0] - z * (az[0] - o[0]), py = sy - o[1] - z * (az[1] - o[1]);
    return [(px * b[1] - py * b[0]) / det, (a[0] * py - a[1] * px) / det];
  };
  /** A dot lying on the glass, r across, at one distance off it. */
  const dotAt = (el: SVGPathElement, x: number, y: number, z: number, r: number) => {
    const pts: Vec2[] = [];
    for (let i = 0; i < 10; i++) pts.push(Q(x + r * Math.cos(i * Math.PI / 5), y + r * Math.sin(i * Math.PI / 5), z));
    el.setAttribute("d", poly(pts));
  };
  const g = mk("g", {}, svg);

  // the display and its menu bar
  const [so, si] = rings(0, 0, W, D, 6, 2.4);
  put(solid(g), prism(Q, front, so, si, -4, 0));
  mk("path", { class: "nf lo", d: seg(Q(6, 8, 0), Q(W - 6, 8, 0)) }, g);
  // what is in the bar: the menus on the left, the clock and two lamps on the right
  let bar = "";
  for (const [x0, x1] of [[13, 19], [22, 27], [30, 37], [40, 44], [101, 110]]) bar += seg(Q(x0, 4.6, 0), Q(x1, 4.6, 0));
  mk("path", { class: "nf lo", d: bar }, g);
  for (const x of [8.5, 93, 97]) dotAt(mk("path", { class: "dot off" }, g), x, 4.6, 0, 0.9);
  // the wallpaper: two hills and a moon; and two files left out on the desktop
  let paper = "";
  const hill = (x: number) => 52 - 15 * Math.exp(-(((x - 34) / 20) ** 2)) - 22 * Math.exp(-(((x - 84) / 26) ** 2));
  for (let x = 4; x < 116; x += 4) paper += seg(Q(x, hill(x), 0), Q(x + 4, hill(x + 4), 0));
  for (let i = 0; i < 16; i++) paper += seg(Q(18 + 4.5 * Math.cos(i * Math.PI / 8), 20 + 4.5 * Math.sin(i * Math.PI / 8), 0), Q(18 + 4.5 * Math.cos((i + 1) * Math.PI / 8), 20 + 4.5 * Math.sin((i + 1) * Math.PI / 8), 0));
  mk("path", { class: "nf lo", d: paper }, g);
  for (const y of [15, 28]) {
    const [fo, fi] = lid(105, y - 3, 111, y + 3, 1.4, 0.5);
    put(solid(g), slab(Q, front, fo, fi, 0, 0.8));
    mk("path", { class: "nf lo", d: seg(Q(104.5, y + 5.6, 0), Q(111.5, y + 5.6, 0)) }, g);
  }

  // the dock: its tray, a lamp for each app that is open, and the icons
  const [dk, di] = lid(24, 58, 96, 73, 4, 0.9);
  put(solid(g), slab(Q, front, dk, di, 0, DT));
  const lamps = NAMES.map((_, k) => { const d = mk("path", { class: "dot m" }, g); dotAt(d, IX(k), 71, DT, 0.7); return d; });
  const icons = NAMES.map(() => ({ el: solid(g), m: spring(0, { k: 220, c: 26, eps: 0.004 }) }));
  function drawIcon(k: number) {
    const m = icons[k].m.x, h = IH * (1 + 0.4 * m), [ring, inner] = lid(IX(k) - h, IY - h, IX(k) + h, IY + h, 1.8, 0.7);
    put(icons[k].el, slab(Q, front, ring, inner, DT, DT + 1.2 + 3.4 * m));
  }

  // the windows share one layer, kept in order of how far forward they are
  const layer = mk("g", {}, g);
  const wins: Win[] = NAMES.map((_, k) => {
    const el = solid(layer);
    const marks = mk("path", { class: "nf lo" }, el.g), dots = [0, 1, 2].map(() => mk("path", { class: "dot off" }, el.g));
    return { k, el, marks, dots, s: spring(0, { k: 150, c: 19, eps: 0.002 }), z: spring(BASE, { eps: 0.02 }), at: 0 };
  });
  function drawWin(w: Win, beat: number) {
    const s = w.s.x;
    if (s < 0.03) { w.el.g.setAttribute("visibility", "hidden"); w.at = -1; return; }
    w.el.g.removeAttribute("visibility");
    // out of its icon: the footprint grows from the icon's to the window's, and it comes forward to its level
    const B = WIN[w.k], x0 = lerp(IX(w.k) - IH, B[0], s), y0 = lerp(IY - IH, B[1], s), x1 = lerp(IX(w.k) + IH, B[2], s), y1 = lerp(IY + IH, B[3], s);
    const z = lerp(DT + 1.2, w.z.x, s), top = z + T, r = Math.min(3, (x1 - x0) / 2 - 0.2, (y1 - y0) / 2 - 0.2);
    const [ring, inner] = lid(x0, y0, x1, y1, r, Math.min(1, r * 0.4));
    put(w.el, slab(Q, front, ring, inner, z, top));
    w.at = z;
    const full = s > 0.5, q = (u: number, v: number) => Q(lerp(x0, x1, u), lerp(y0, y1, v), top);
    w.marks.setAttribute("d", full ? seg(q(0.05, 0.22), q(0.95, 0.22)) + holds(w.k, beat).map((h) => seg(q(h[0], h[1]), q(h[2], h[3]))).join("") : "");
    w.dots.forEach((d, i) => { if (full) dotAt(d, x0 + 4.5 + i * 3.2, lerp(y0, y1, 0.11), top, 0.7); else d.setAttribute("d", ""); });
  }

  // the page's cursor, over the figure, is the desktop's: the dart laid in the glass's plane, a fixed size on the page
  const dart = ARROW.map(([u, v]): Vec2 => [u * a[0] + v * b[0], u * a[1] + v * b[1]]);
  const lo = [Math.min(...dart.map((q) => q[0])), Math.min(...dart.map((q) => q[1]))], hi = [Math.max(...dart.map((q) => q[0])), Math.max(...dart.map((q) => q[1]))];
  const f = 22 / (hi[1] - lo[1]), pad = 2, cw = Math.ceil((hi[0] - lo[0]) * f + 2 * pad), ch = 22 + 2 * pad;
  const dartD = poly(dart.map((q): Vec2 => [(q[0] - lo[0]) * f + pad, (q[1] - lo[1]) * f + pad]));
  const was = stage.style.cursor;
  /** Drawn in the theme's ink at the moment it is asked for, since the theme can change under a mounted figure. */
  let worn = false;
  function wear() {
    // a figure is mounted before it is in the page, and has no colours until it is
    if (!svg.isConnected) return;
    worn = true;
    const cs = getComputedStyle(wins[0].el.sil), ink = getComputedStyle(wins[Math.max(lit, 0)].el.sil).stroke;
    const img = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}"><path d="${dartD}" fill="${cs.fill}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
    stage.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(img)}") ${Math.round(-lo[0] * f + pad)} ${Math.round(-lo[1] * f + pad)}, default`;
  }
  bag.add(() => { stage.style.cursor = was; });

  let n = clamp(Math.round(value), 1, 3), pile = REST.slice(-n), over = false, lit = -2, order = "";
  const L = register(stage, (dt, now) => {
    let m = false;
    if (!worn) wear();
    // the player plays while it is the front window and a hand is on the desktop
    const playing = over && pile[pile.length - 1] === 2 && !reducedMotion();
    for (const w of wins) { m = stepS(w.s, dt) || m; m = stepS(w.z, dt) || m; drawWin(w, w.k === 2 && playing ? now / 1000 : -1); }
    icons.forEach((ic, k) => { m = stepS(ic.m, dt) || m; drawIcon(k); });
    // the layer is re-appended only when one window has passed another
    const up = wins.filter((w) => w.at >= 0).sort((p, q) => p.at - q.at), sig = up.map((w) => w.k).join();
    if (sig !== order) { order = sig; up.forEach((w) => layer.appendChild(w.el.g)); }
    return m || playing;
  });
  bag.add(L.unregister);

  function arrange() {
    for (const w of wins) {
      const pos = pile.indexOf(w.k);
      w.s.t = pos < 0 ? 0 : 1;
      if (pos >= 0) { w.z.t = BASE + pos * GAP; if (w.s.x < 0.03) w.z.x = w.z.t; }
      lamps[w.k].setAttribute("visibility", pos < 0 ? "hidden" : "visible");
    }
    const on = pile[pile.length - 1];
    if (on !== lit) {
      lit = on;
      wins.forEach((w) => { w.el.sil.classList.toggle("hi", w.k === on); w.dots.forEach((d) => d.setAttribute("class", w.k === on ? "dot m" : "dot off")); });
    }
    if (over) read.textContent = NAMES[on];
    L.wake();
  }
  // nothing flies in on mount: what is open at rest is simply there
  pile.forEach((k) => { wins[k].s.x = 1; });
  arrange();

  const bring = (k: number) => {
    if (pile[pile.length - 1] === k) return;
    pile = pile.filter((x) => x !== k).concat(k).slice(-n);
    arrange();
  };
  bag.add(pointer(stage, {
    move: (p) => {
      if (!over) { over = true; wear(); read.textContent = NAMES[pile[pile.length - 1]]; }
      const [x, y] = back(p[0], p[1], DT), docked = x >= 22 && x <= 98 && y >= 56 && y <= 77;
      icons.forEach((ic, k) => { ic.m.t = docked ? clamp(1 - Math.abs(x - IX(k)) / 22, 0, 1) : 0; });
      if (docked) bring(clamp(Math.round((x - IX(0)) / 13), 0, NAMES.length - 1));
      else {
        // a window is tried on the nearest level to the glass whatever level it floats on, the front one first
        const [wx, wy] = back(p[0], p[1], BASE + T);
        for (let i = pile.length - 1; i >= 0; i--) {
          const B = WIN[pile[i]];
          if (wx >= B[0] && wx <= B[2] && wy >= B[1] && wy <= B[3]) { bring(pile[i]); break; }
        }
      }
      L.wake();
    },
    leave: () => {
      over = false;
      icons.forEach((ic) => { ic.m.t = 0; });
      pile = REST.slice(-n);
      read.textContent = "rest";
      arrange();
    },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      n = clamp(Math.round(v), 1, 3);
      pile = over ? pile.slice(-n) : REST.slice(-n);
      arrange();
    },
    destroy: bag.dispose,
  };
};
