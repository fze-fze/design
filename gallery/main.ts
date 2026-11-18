import * as lib from "../src/index";
import type { Figure, HairlineOptions } from "../src/index";
import { PACKAGE, SHELVES, TITLE, type Entry } from "./catalog";

/**
 * The gallery: every figure on its shelf, straight from src. A tile answers
 * the pointer; a click opens it large, with its read-out, its slider and its
 * code, and the arrow keys walk to the next. `?only=<id>` shows one figure
 * alone, for looking at a new one.
 */

type Mount = (el: HTMLElement, options?: HairlineOptions) => Figure;
const mounts = lib as unknown as Record<string, Mount>;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
};
const two = (n: number) => String(n).padStart(2, "0");

const params = new URLSearchParams(location.search);
const only = params.get("only");
let intensity = Number(params.get("intensity") ?? 0.5), play = params.has("play");
const live: Figure[] = [], all: Entry[] = SHELVES.flatMap((s) => s.figures);

/* ---------- shelves ---------- */

document.title = TITLE;
$("title").textContent = TITLE;
$("count").textContent = `figures / ${all.length}`;

for (const shelf of SHELVES) {
  const figures = shelf.figures.filter((f) => !only || f.id === only);
  if (!figures.length) continue;
  const sec = h("section", "shelf"), label = h("div", "label"), grid = h("div", "grid");
  label.append(h("b", "", shelf.title), h("span", "", two(figures.length)));
  for (const f of figures) {
    const tile = h("article", "tile"), fig = h("div"), meta = h("div", "meta"), read = h("span", "read");
    tile.tabIndex = 0;
    meta.append(h("span", "name", f.name), read);
    tile.append(h("span", "idx", two(all.indexOf(f) + 1)), fig, meta);
    tile.addEventListener("click", () => open(f));
    tile.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === tile) open(f); });
    grid.append(tile);
    live.push(mounts[f.id](fig, { intensity, play, onRead: (t) => { read.textContent = t; } }));
  }
  sec.append(label, grid);
  $("shelves").append(sec);
}
if (only) (document.querySelector(".grid") as HTMLElement).style.gridTemplateColumns = "minmax(0, 720px)";

/* ---------- the page's controls ---------- */

const slider = $<HTMLInputElement>("intensity"), playBtn = $("play"), themeBtn = $("theme");
slider.value = String(intensity);
$("intensity-out").textContent = intensity.toFixed(2);
slider.addEventListener("input", () => {
  intensity = Number(slider.value);
  $("intensity-out").textContent = intensity.toFixed(2);
  live.forEach((f) => f.update({ intensity }));
});
playBtn.setAttribute("aria-pressed", String(play));
playBtn.addEventListener("click", () => {
  play = !play;
  playBtn.setAttribute("aria-pressed", String(play));
  live.forEach((f) => f.update({ play }));
});
const root = document.documentElement;
const setTheme = (t: string) => {
  root.dataset.theme = t;
  themeBtn.setAttribute("aria-pressed", String(t === "dark"));
  try { localStorage.setItem("hairline-theme", t); } catch { /* private window */ }
};
let saved: string | null = null;
try { saved = localStorage.getItem("hairline-theme"); } catch { /* private window */ }
setTheme(params.get("theme") ?? saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeBtn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

/* ---------- the viewer ---------- */

const dialog = $<HTMLDialogElement>("viewer"), vSlider = $<HTMLInputElement>("v-intensity"), vPlay = $("v-play");
let big: Figure | null = null, current: Entry | null = null, tab = "react", vOn = false;

function code() {
  if (!current) return;
  const { id, name } = current, i = Number(vSlider.value), opts = [i !== 0.5 ? `intensity: ${i}` : "", vOn ? "play: true" : ""].filter(Boolean);
  const props = (i !== 0.5 ? ` intensity={${i}}` : "") + (vOn ? " play" : "");
  $("code").textContent = tab === "react"
    ? `import { ${name} } from "${PACKAGE}/react";\n\n<${name}${props} />`
    : `import { ${id} } from "${PACKAGE}";\n\nconst figure = ${id}(el${opts.length ? `, { ${opts.join(", ")} }` : ""});\n\nfigure.update({ intensity: 0.8 });\nfigure.destroy();`;
}
const setPlay = (on: boolean) => {
  vOn = on;
  vPlay.setAttribute("aria-pressed", String(on));
  vPlay.textContent = on ? "on" : "off";
  big?.update({ play: on });
  code();
};

function open(f: Entry) {
  big?.destroy();
  current = f;
  $("v-idx").textContent = `${two(all.indexOf(f) + 1)} / ${all.length}`;
  $("v-name").textContent = f.name;
  $("v-zh").textContent = f.zh;
  $("v-stronger").textContent = f.stronger;
  vSlider.value = String(intensity);
  $("v-out").textContent = intensity.toFixed(2);
  if (!dialog.open) dialog.showModal();
  big = mounts[f.id]($("big"), { intensity, onRead: (t) => { $("big-read").textContent = t; } });
  setPlay(false);
}
const step = (d: number) => { if (current) open(all[(all.indexOf(current) + d + all.length) % all.length]); };

/* the close event can arrive after the next figure was opened: only an event that finds the dialog shut clears it */
dialog.addEventListener("close", () => { if (dialog.open) return; big?.destroy(); big = null; current = null; });
dialog.addEventListener("keydown", (e) => {
  // the arrows belong to a figure or a slider that has the focus
  if ((e.target as HTMLElement).closest("#big, input")) return;
  if (e.key === "ArrowRight") step(1);
  if (e.key === "ArrowLeft") step(-1);
});
$("close").addEventListener("click", () => dialog.close());
$("prev").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
vSlider.addEventListener("input", () => { $("v-out").textContent = Number(vSlider.value).toFixed(2); big?.update({ intensity: Number(vSlider.value) }); code(); });
vPlay.addEventListener("click", () => setPlay(!vOn));
document.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) => b.addEventListener("click", () => {
  tab = b.dataset.tab!;
  document.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  code();
}));
$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("code").textContent ?? "");
  $("copy").textContent = "copied";
  setTimeout(() => { $("copy").textContent = "copy"; }, 1200);
});
