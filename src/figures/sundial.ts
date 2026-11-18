import { Cam, circ, clamp, facing, fit, lerp, poly, prism, proj, r2, rad, seg, type Vec2, type Vec3 } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";
import { TABLE } from "../intensity";

/**
 * Sundial: a round dial, a fin standing on it, and a sun on its arc across
 * the sky behind. Moving the pointer across the stage is the day going by:
 * the sun travels from the left horizon over the top to the right one, and
 * the fin's shadow swings round the dial under it, long at the ends of the
 * day and short at noon. The shadow's edge is the bright mark, lying on the
 * hour, and the hour goes to the read-out. The slider is the season: how
 * high the sun stands at noon.
 *
 * The pattern: scrub. One spring on one number, the time of day; the sun,
 * the shadow and the read-out are all drawn from it.
 */

const R = 46, TOP = 3, H = 24, FIN = 20, SKY = 66, LOW = rad(30), DAWN = 6, DUSK = 18, REST = 9.5;
const Q = Math.SQRT1_2;
/** Toward the sun along the ground at day-angle a: from the left of the page, round the back, to the right. */
const toward = (a: number): Vec2 => [-Q * Math.cos(a) - Q * Math.sin(a), Q * Math.cos(a) - Q * Math.sin(a)];
const angle = (t: number) => Math.PI * (t - DAWN) / (DUSK - DAWN);

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let noon = rad(value);
  const height = (a: number) => lerp(LOW, noon, Math.sin(a));
  const sunAt = (a: number): Vec3 => { const u = toward(a), e = height(a); return [u[0] * Math.cos(e) * SKY, u[1] * Math.cos(e) * SKY, TOP + Math.sin(e) * SKY]; };
  const C = Cam(45, 0.5, 1.5), hi = rad(TABLE.sundial[2]);
  fit(C, [[-R, -R, 0], [R, R, 0], [R, -R, 0], [-R, R, 0], [-Q * SKY * 0.9, Q * SKY * 0.9, TOP + 30], [Q * SKY * 0.9, -Q * SKY * 0.9, TOP + 30], [-Q * SKY * Math.cos(hi), -Q * SKY * Math.cos(hi), TOP + SKY * Math.sin(hi) + 6]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the sky first, behind everything: the sun's track, and the sun
  const track = mk("path", { class: "nf lo dash" }, g);
  const sun = mk("path", { class: "sil" }, g), rays = mk("path", { class: "nf lo" }, g);
  function sky() {
    const pts: Vec2[] = [];
    for (let i = 0; i <= 48; i++) { const s = sunAt(Math.PI * i / 48); pts.push(P(s[0], s[1], s[2])); }
    track.setAttribute("d", pts.map((p, i) => (i ? "L" : "M") + r2(p[0]) + " " + r2(p[1])).join(""));
  }
  sky();

  // the dial and its hours: a tick where the shadow's edge lies at each, a longer one every third
  put(solid(g), prism(P, front, circ(R, 64), circ(R - 2.6, 64), 0, TOP));
  let ticks = "";
  for (let h = DAWN; h <= DUSK; h++) {
    const u = toward(angle(h)), r0 = (h - DAWN) % 3 ? 37.5 : 33.5;
    ticks += seg(P(-u[0] * r0, -u[1] * r0, TOP), P(-u[0] * 41, -u[1] * 41, TOP));
  }
  mk("path", { class: "nf lo", d: ticks }, g);

  // the shadow on the dial, then the fin that casts it; the fin's back runs toward the noon sun
  const shade = mk("path", { class: "nf lo" }, g), edge = mk("path", { class: "nf hi" }, g);
  const back: Vec2 = [-Q * FIN, -Q * FIN];
  mk("path", { class: "sil", d: poly([P(0, 0, TOP), P(back[0], back[1], TOP), P(0, 0, TOP + H)]) }, g);

  const sp = spring(REST, { k: 60, c: 16, eps: 0.002 });
  let drawn = NaN;
  function draw(force = false) {
    if (sp.x === drawn && !force) return;
    drawn = sp.x;
    const a = angle(clamp(sp.x, DAWN, DUSK)), u = toward(a), len = H / Math.tan(height(a)), tip: Vec2 = [-u[0] * len, -u[1] * len];
    const T = P(tip[0], tip[1], TOP);
    // the shadow is the fin laid down: its foot, its back, and where its top falls, hatched from the back
    let d = poly([P(0, 0, TOP), P(back[0], back[1], TOP), T]);
    for (const f of [0.25, 0.5, 0.75]) d += seg(P(back[0] * f, back[1] * f, TOP), T);
    shade.setAttribute("d", d);
    edge.setAttribute("d", seg(P(0, 0, TOP), T));
    const s = sunAt(a), c = P(s[0], s[1], s[2]);
    const rim: Vec2[] = [];
    for (let i = 0; i < 28; i++) rim.push([c[0] + Math.cos(i * Math.PI / 14) * 5.5, c[1] + Math.sin(i * Math.PI / 14) * 5.5]);
    sun.setAttribute("d", poly(rim));
    let ry = "";
    for (let i = 0; i < 8; i++) { const q = i * Math.PI / 4; ry += seg([c[0] + Math.cos(q) * 8.5, c[1] + Math.sin(q) * 8.5], [c[0] + Math.cos(q) * 11.5, c[1] + Math.sin(q) * 11.5]); }
    rays.setAttribute("d", ry);
  }

  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      sp.t = lerp(DAWN, DUSK, clamp((p[0] - 70) / 260, 0, 1));
      const min = Math.round(sp.t * 12) * 5;
      read.textContent = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
      B.wake();
    },
    leave: () => { sp.t = REST; read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { noon = rad(v); sky(); draw(true); }, destroy: bag.dispose };
};
