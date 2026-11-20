import { Cam, clamp, facing, fillet, poly, prism, proj, rings, type Projector, type Vec2 } from "../core/iso";
import { spring, stepS } from "../core/motion";
import { disposer, mk, pointer, put, register, solid, type FigureMount } from "../core/stage";

/** A hand-operated mechanism with a single degree of freedom. */
export function scrub(rest: number, build: (svg: SVGSVGElement) => (position: number) => void,
  describe: (position: number) => string, vertical = false): FigureMount {
  return ({ stage, svg, read }, value) => {
    const bag = disposer(), draw = build(svg), pose = spring(rest, { eps: 0.0001 });
    let reach = value, hand: number | null = null, drawn = NaN;
    const loop = register(stage, dt => {
      const moving = stepS(pose, dt);
      if (drawn !== pose.x) { drawn = pose.x; draw(pose.x); }
      return moving;
    });
    function aim() {
      pose.t = hand === null ? rest : hand * reach;
      read.textContent = hand === null ? "rest" : describe(pose.t);
      loop.wake();
    }
    bag.add(loop.unregister);
    bag.add(pointer(stage, {
      move: ([x, y]) => { hand = clamp(vertical ? (244 - y) / 156 : (x - 95) / 210, 0, 1); aim(); },
      leave: () => { hand = null; aim(); },
    }));
    bag.add(() => svg.replaceChildren());
    return { set(v) { reach = v; aim(); }, destroy: bag.dispose };
  };
}

export function scene(scale: number, cy: number) {
  const camera = Cam(45, 0.5, scale);
  camera.ox = 200; camera.oy = cy;
  const P = proj(camera);
  function plate(parent: Element, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, radius: number) {
    const part = solid(parent);
    put(part, prism(P, facing(camera), ...rings(x0, y0, x1, y1, radius, 1), z0, z1));
    return part;
  }
  return { P, plate };
}

export const path = (parent: Element, cls = "nf lo") => mk("path", { class: cls }, parent);
export const rounded = (points: Vec2[], radius = 1.6) => poly(fillet(points, points.map(() => radius)));
export function circle(P: Projector, x: number, y: number, z: number, radius: number) {
  return poly(Array.from({ length: 80 }, (_, i) => {
    const a = i * Math.PI / 40;
    return P(x + radius * Math.cos(a), y + radius * Math.sin(a), z);
  }));
}
