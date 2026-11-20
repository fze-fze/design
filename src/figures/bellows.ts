import { hull, poly, rrect, type Vec2 } from "../core/iso";
import { path, scene, scrub } from "./scrub";

export const mount = scrub(0.47, svg => {
  const { P, plate } = scene(2.05, 211);
  plate(svg, -58, -22, 59, 22, 0, 4, 4);
  for (const y of [-16, 12]) plate(svg, -54, y, 55, y + 4, 4, 7, 1.6);
  function frame(x: number, width: number, height: number) {
    return rrect(-width, -height, width, height, 3).map(q => P(x, q.u, 35 + q.v));
  }
  const body = path(svg, "sil");
  body.setAttribute("d", poly(hull([...frame(-53, 28, 28), ...frame(-42, 28, 28)])));
  path(svg).setAttribute("d", poly(frame(-42, 25.5, 25.5)));
  const folds = Array.from({ length: 9 }, () => path(svg, "sil"));
  const standard = path(svg, "sil"), barrel = path(svg, "sil"), lens = path(svg, "sil hi"), glass = path(svg);
  function optic(x: number, r: number): Vec2[] {
    return Array.from({ length: 64 }, (_, i) => P(x, r * Math.cos(i * Math.PI / 32), 35 + r * Math.sin(i * Math.PI / 32)));
  }
  return travel => {
    const length = 25 + 58 * travel, front = -41 + length;
    folds.forEach((fold, i) => {
      const x = -41 + length * i / 9, w = 25 - 7 * i / 9;
      fold.setAttribute("d", poly(hull([...frame(x, w - 3, w - 3), ...frame(x + length / 18, w, w), ...frame(x + length / 9, w - 3, w - 3)])));
    });
    standard.setAttribute("d", poly(hull([...frame(front, 21, 28), ...frame(front + 4, 21, 28)])));
    barrel.setAttribute("d", poly(hull([...optic(front + 4, 14), ...optic(front + 16, 14)])));
    lens.setAttribute("d", poly(optic(front + 16, 14)));
    glass.setAttribute("d", poly(optic(front + 16, 10.5)));
  };
}, t => Math.round(25 + 58 * t) + " mm");
