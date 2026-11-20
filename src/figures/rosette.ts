import { open, seg } from "../core/iso";
import { mk, place } from "../core/stage";
import { circle, path, scene, scrub } from "./scrub";

export const mount = scrub(0.68, svg => {
  const { P, plate } = scene(2.05, 168);
  plate(svg, -61, -61, 61, 61, -4, 0, 12);
  const radius = 54, wheel = 18, offset = 13;
  path(svg, "nf").setAttribute("d", circle(P, 0, 0, 0, radius));
  path(svg).setAttribute("d", circle(P, 0, 0, 0, radius + 3));
  const trace = path(svg, "nf hi"), rim = path(svg, "sil"), hub = path(svg), spoke = path(svg);
  const pin = mk("circle", { class: "dot", r: 2 }, svg);
  // Rolling without slip: the wheel turns twice backwards for each orbit.
  function mechanism(a: number) {
    const x = (radius - wheel) * Math.cos(a), y = (radius - wheel) * Math.sin(a);
    return { x, y, px: x + offset * Math.cos(2 * a), py: y - offset * Math.sin(2 * a) };
  }
  const samples = Array.from({ length: 241 }, (_, i) => {
    const { px, py } = mechanism(i * Math.PI / 120);
    return P(px, py, 0);
  });
  return travel => {
    const a = Math.PI * 2 * travel;
    const { x, y, px, py } = mechanism(a);
    trace.setAttribute("d", open([...samples.slice(0, Math.floor(travel * 240) + 1), P(px, py, 0)]));
    rim.setAttribute("d", circle(P, x, y, 1, wheel));
    hub.setAttribute("d", circle(P, x, y, 1, 3.5));
    spoke.setAttribute("d", seg(P(x, y, 1), P(px, py, 1)));
    place(pin, P(px, py, 1));
  };
}, t => Math.round(t * 360) + "°");
