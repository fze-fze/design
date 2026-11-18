import { Cam, circ, clamp, facing, fit, lerp, poly, prism, proj, r2, rad, rings, seg, type Vec2 } from "../core/iso";
import { reducedMotion } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";

/**
 * Globe: a desk globe in its meridian ring, on a post and a round foot. It
 * turns slowly on its tilted axis by itself. The pointer lays a hand on it:
 * moving across drags the surface with it, a still hand holds it, and on
 * leaving it coasts from the speed it was given down to the slow turn. The
 * land is drawn as outlines over a dim graticule, only on the side that
 * faces; one bright pin rides with it. The slider is how long it coasts.
 *
 * The pattern: ambient, with a hand in it. One number, the turn. The sphere
 * is drawn in the view's own plane (right, up, toward the eye), so its
 * outline is a circle and "facing" is one sign.
 */

const R = 38, RHO = 43, BAND = 2.6, H = 14, BR = 24, TILT = rad(23.5), AMB = 0.35;
const AX = Math.sin(TILT), AY = Math.cos(TILT);
/** A point of the unit sphere at latitude (as its cosine and sine) and turn t: right, up, toward the eye. */
const at = (cl: number, sl: number, t: number): [number, number, number] => {
  const c = cl * Math.cos(t);
  return [c * AY + sl * AX, sl * AY - c * AX, cl * Math.sin(t)];
};
/** The land, roughly: closed outlines in degrees of latitude and longitude. */
const LAND: number[][][] = [
  [[35, -5], [37, 10], [31, 32], [12, 43], [11, 51], [-4, 40], [-25, 35], [-34, 20], [-17, 12], [4, 9], [5, -8], [15, -17], [28, -13]],
  [[36, -9], [43, -9], [48, -4], [54, 8], [58, 6], [70, 25], [68, 60], [73, 90], [72, 130], [66, 178], [60, 163], [52, 157], [60, 142], [40, 130], [35, 127], [30, 122], [22, 108], [9, 105], [1, 103], [13, 100], [22, 90], [8, 77], [24, 67], [25, 57], [13, 45], [30, 35], [37, 36], [41, 29], [38, 24], [45, 13], [38, 16], [44, 8], [37, -2]],
  [[60, -165], [71, -156], [70, -130], [68, -95], [60, -78], [52, -56], [45, -65], [30, -81], [25, -80], [30, -90], [20, -97], [21, -87], [15, -84], [9, -79], [8, -83], [16, -95], [23, -106], [32, -117], [48, -124], [58, -136]],
  [[10, -72], [11, -62], [0, -50], [-7, -35], [-23, -42], [-38, -57], [-54, -68], [-45, -75], [-18, -70], [-5, -81], [1, -79]],
  [[-12, 131], [-11, 142], [-24, 153], [-38, 146], [-35, 117], [-22, 114]],
  [[60, -45], [70, -22], [82, -30], [78, -70]],
];
const PIN = [31, 121];
type Pt = { cl: number; sl: number; lon: number };
const pt = (lat: number, lon: number): Pt => ({ cl: Math.cos(rad(lat)), sl: Math.sin(rad(lat)), lon: rad(lon) });
/** Each outline with a point every six degrees or so, closed, so a straight run still bends with the sphere. */
const SHORES = /* @__PURE__ */ LAND.map((ring) => {
  const out: Pt[] = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 6));
    for (let k = 0; k < n; k++) out.push(pt(lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)));
  });
  out.push(out[0]);
  return out;
});

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 2), S = C.S, zf = Math.sqrt(1 - C.k * C.k), cz = Math.cos(C.az), sz = Math.sin(C.az), out = RHO + BAND;
  fit(C, [[-BR, -BR, 0], [BR, BR, 0], [BR, -BR, 0], [-BR, BR, 0], [0, 0, H + 2 * out / zf], [out * cz, -out * sz, H + out / zf], [-out * cz, out * sz, H + out / zf]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the foot and the post, in the world; everything above stands in the view's plane, on the post's top
  put(solid(g), prism(P, front, circ(BR, 48), circ(BR - 2.4, 48), 0, 4));
  const [po, pi] = rings(-1.7, -1.7, 1.7, 1.7, 1.2, 0.5);
  put(solid(g), prism(P, front, po, pi, 4, H));
  const foot = P(0, 0, H), ox = foot[0], oy = foot[1] - S * out;
  const pol = (r: number, a: number): Vec2 => [ox + S * r * Math.cos(a), oy - S * r * Math.sin(a)];
  // the meridian ring: a band from past one pole, round the back, to under the globe
  const band: Vec2[] = [];
  for (let a = 54; a <= 285; a += 3) band.push(pol(out, rad(a)));
  for (let a = 285; a >= 54; a -= 3) band.push(pol(RHO, rad(a)));
  mk("path", { class: "sil", d: poly(band) }, g);
  const pole = Math.PI / 2 - TILT;
  mk("path", { class: "nf", d: seg(pol(R, pole), pol(RHO, pole)) + seg(pol(R, pole + Math.PI), pol(RHO, pole + Math.PI)) }, g);
  mk("ellipse", { class: "sil", cx: r2(ox), cy: r2(oy), rx: r2(S * R), ry: r2(S * R) }, g);

  /** A run of points as a path, broken wherever it goes round the back. */
  const trace = (pts: Array<[number, number, number]>) => {
    let d = "", pen = false;
    for (const p of pts) {
      if (p[2] > 0) { d += (pen ? "L" : "M") + r2(ox + S * R * p[0]) + " " + r2(oy - S * R * p[1]); pen = true; } else pen = false;
    }
    return d;
  };
  // the parallels never change: a turn carries each along itself
  let lat = "";
  for (const l of [-60, -30, 0, 30, 60]) {
    const run: Array<[number, number, number]> = [];
    for (let k = 0; k <= 72; k++) run.push(at(Math.cos(rad(l)), Math.sin(rad(l)), rad(k * 5)));
    lat += trace(run);
  }
  mk("path", { class: "nf lo", d: lat }, g);
  const lines = mk("path", { class: "nf lo" }, g), land = mk("path", { class: "nf" }, g);
  const pin = mk("ellipse", { class: "dot", rx: 2.4, ry: 2.4 }, g), pinAt = pt(PIN[0], PIN[1]);

  let coast = value / 1000, phi = rad(110), w = -AMB, over = false, last: Vec2 | null = null, lastT = 0, drawn = NaN;
  function draw() {
    if (phi === drawn) return;
    drawn = phi;
    let d = "";
    for (let m = 0; m < 12; m++) {
      const run: Array<[number, number, number]> = [];
      for (let k = -8; k <= 8; k++) run.push(at(Math.cos(rad(k * 10)), Math.sin(rad(k * 10)), phi - rad(m * 30)));
      d += trace(run);
    }
    lines.setAttribute("d", d);
    land.setAttribute("d", SHORES.map((s) => trace(s.map((q) => at(q.cl, q.sl, phi - q.lon)))).join(""));
    const p = at(pinAt.cl, pinAt.sl, phi - pinAt.lon);
    if (p[2] > 0.08) { pin.removeAttribute("visibility"); pin.setAttribute("cx", String(r2(ox + S * R * p[0]))); pin.setAttribute("cy", String(r2(oy - S * R * p[1]))); }
    else pin.setAttribute("visibility", "hidden");
    if (over) {
      // the meridian that faces: a quarter turn behind the one the turn is counted from
      const lon = ((((phi - Math.PI / 2) * 180 / Math.PI + 180) % 360) + 360) % 360 - 180;
      read.textContent = `${Math.abs(Math.round(lon))}°${lon < 0 ? "W" : "E"}`;
    }
  }

  const B = register(stage, (dt) => {
    if (over) w *= Math.exp(-dt / 0.12);              // a hand that stops forgets its fling
    else if (reducedMotion()) w = 0;
    else { w += (-AMB - w) * (1 - Math.exp(-dt / coast)); phi += w * dt; }
    draw();
    return !reducedMotion();
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      const now = performance.now();
      if (last) {
        // the surface under the hand goes with it; east is to the right, and the turn is counted westward
        const d = (p[0] - last[0]) / (S * R);
        phi -= d;
        w = clamp(lerp(w, -d / (Math.max(8, now - lastT) / 1000), 0.5), -9, 9);
      }
      last = p; lastT = now; over = true; drawn = NaN;
      B.wake();
    },
    leave: () => { over = false; last = null; read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { coast = v / 1000; }, destroy: bag.dispose };
};
