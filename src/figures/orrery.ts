import { seg } from "../core/iso";
import { mk, place } from "../core/stage";
import { circle, path, scene, scrub } from "./scrub";

export const mount = scrub(0.14, svg => {
  const { P, plate } = scene(1.93, 194);
  plate(svg, -24, -24, 24, 24, 0, 5, 12);
  plate(svg, -6, -6, 6, 6, 5, 34, 4);
  const bodies = [62, 43, 24].map((r, i) => {
    const z = 22 + i * 7;
    path(svg, "nf lo").setAttribute("d", circle(P, 0, 0, z, r));
    const g = mk("g", {}, svg);
    return { r, z, g, arm: path(g, "nf"), ball: mk("ellipse", { class: "sil", rx: [10, 7, 4.5][i], ry: [10, 7, 4.5][i] }, g) };
  });
  const sun = mk("ellipse", { class: "sil hi", rx: 16, ry: 16 }, svg);
  place(sun, P(0, 0, 39));
  return travel => {
    const layers = bodies.map(({ r, z, g, arm, ball }, i) => {
      const angle = [0.4, 2.6, 4.6][i] + travel * Math.PI * (1 + i);
      const x = r * Math.cos(angle), y = r * Math.sin(angle);
      arm.setAttribute("d", seg(P(0, 0, z), P(x, y, z)));
      place(ball, P(x, y, z));
      return { g, depth: x + y };
    });
    for (const layer of layers.sort((a, b) => a.depth - b.depth)) {
      if (layer.depth < 0) svg.insertBefore(layer.g, sun);
      else svg.append(layer.g);
    }
  };
}, t => Math.round(t * 180) + "°");
