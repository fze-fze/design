import { rad, seg } from "../core/iso";
import { mk, place } from "../core/stage";
import { path, rounded, scene, scrub } from "./scrub";

export const mount = scrub(0.58, svg => {
  const { P } = scene(1.85, 224);
  const leaves = Array.from({ length: 12 }, () => ({
    rib: path(svg, "sil"), pleat: path(svg, "sil"), fold: path(svg),
  }));
  const guard = path(svg, "sil hi"), rivet = mk("circle", { r: 1.9, class: "dot" }, svg);
  // The paper sits above the exposed sticks, with alternating mountain and valley folds.
  return travel => {
    const span = rad(22 + 125 * travel);
    function at(a: number, r: number, ridge = 0) {
      const side = r * Math.sin(a), back = r * Math.cos(a);
      return P((side - back * 0.52) / Math.SQRT2, (-side - back * 0.52) / Math.SQRT2, back * 0.82 + ridge);
    }
    leaves.forEach(({ rib, pleat, fold }, i) => {
      const a = -0.98 + i * span / 12, b = a + span / 12, m = (a + b) / 2;
      rib.setAttribute("d", rounded([at(a - 0.035, -5), at(a - 0.018, 78), at(a + 0.018, 78), at(a + 0.035, 5)], 0.9));
      pleat.setAttribute("d", rounded([at(a, 37), at(a, 81), at(m, 82, 1.7), at(b, 81), at(b, 37), at(m, 37, 1.7)], 0.75));
      fold.setAttribute("d", seg(at(m, 38, 1.7), at(m, 80, 1.7)));
    });
    const end = span - 0.98;
    guard.setAttribute("d", rounded([at(end - 0.028, 82), at(end + 0.028, 82), at(end + 0.48, -6), at(end - 0.48, -6)], 1));
    place(rivet, P(0, 0, 0));
  };
}, t => Math.round(22 + 125 * t) + "°");
