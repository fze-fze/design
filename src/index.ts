import { create, type Figure, type HairlineOptions } from "./mount";
import { mount as basketEngine } from "./figures/basket";
import { mount as branchesEngine } from "./figures/branches";
import { mount as cabinetEngine } from "./figures/cabinet";
import { mount as dishEngine } from "./figures/dish";
import { mount as drawerEngine } from "./figures/drawer";
import { mount as elevatorEngine } from "./figures/elevator";
import { mount as explodedEngine } from "./figures/exploded";
import { mount as formatEngine } from "./figures/format";
import { mount as hubEngine } from "./figures/hub";
import { mount as keyboardEngine } from "./figures/keyboard";
import { mount as laptopEngine } from "./figures/laptop";
import { mount as lockersEngine } from "./figures/lockers";
import { mount as loupeEngine } from "./figures/loupe";
import { mount as padlockEngine } from "./figures/padlock";
import { mount as patchEngine } from "./figures/patch";
import { mount as phoneEngine } from "./figures/phone";
import { mount as phosphorEngine } from "./figures/phosphor";
import { mount as plotEngine } from "./figures/plot";
import { mount as plugEngine } from "./figures/plug";
import { mount as queryEngine } from "./figures/query";
import { mount as railEngine } from "./figures/rail";
import { mount as rebuildEngine } from "./figures/rebuild";
import { mount as relayEngine } from "./figures/relay";
import { mount as riffleEngine } from "./figures/riffle";
import { mount as routerEngine } from "./figures/router";
import { mount as settleEngine } from "./figures/settle";
import { mount as sieveEngine } from "./figures/sieve";
import { mount as slowEngine } from "./figures/slow";
import { mount as stackEngine } from "./figures/stack";
import { mount as terminalEngine } from "./figures/terminal";
import { mount as terrainEngine } from "./figures/terrain";
import { mount as turntableEngine } from "./figures/turntable";
import { mount as vaultEngine } from "./figures/vault";
import { mount as globeEngine } from "./figures/globe";
import { mount as deskEngine } from "./figures/desk";
import { mount as desktopEngine } from "./figures/desktop";
import { mount as abacusEngine } from "./figures/abacus";
import { mount as compassEngine } from "./figures/compass";
import { mount as sundialEngine } from "./figures/sundial";
import { mount as puzzleEngine } from "./figures/puzzle";
import { mount as hourglassEngine } from "./figures/hourglass";
import { mount as staplerEngine } from "./figures/stapler";
import { mount as pencilcaseEngine } from "./figures/pencilcase";
import { mount as dominoesEngine } from "./figures/dominoes";
import { mount as fadersEngine } from "./figures/faders";
import { mount as cradleEngine } from "./figures/cradle";
import { mount as metronomeEngine } from "./figures/metronome";

/**
 * @lucasmarkes/hairline — thirty-three isometric line figures that answer the pointer.
 *
 * One function per figure. Each takes an element and the same options, draws
 * into the element, and returns `{ update, destroy }`. Each function names
 * its engine itself, so a bundle that imports one figure carries one.
 */

export type { Figure, HairlineOptions } from "./mount";

/** A tray of eight cards. The card under the pointer stands up; the arrow keys walk the cards. `intensity` spreads the ripple further from the pulled card. */
export function riffle(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "riffle",
    label: "A tray of eight cards. Hover or use the arrow keys to pull a card.",
    rest: "rest",
    engine: riffleEngine,
    focusable: true,
  }, el, options);
}

/** Eighty-one pillars on a plinth that rise around the pointer. `intensity` widens the area that rises. */
export function terrain(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "terrain",
    label: "Eighty-one pillars on a plinth that rise around the pointer and rest as a dune with two rises.",
    rest: "rest",
    engine: terrainEngine,
  }, el, options);
}

/** An app window in four layers. Moving across opens the gap; moving down picks a layer. `intensity` opens the layers further. */
export function exploded(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "exploded",
    label: "An app window taken apart into four layers. Moving across opens the gap; moving down picks a layer.",
    rest: "",
    engine: explodedEngine,
  }, el, options);
}

/** A seven by seven dot matrix that plays a loop, and fades like phosphor where the pointer paints it. `intensity` makes the trail linger longer. */
export function phosphor(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "phosphor",
    label: "A seven by seven dot matrix on a floating tile that plays a loop, and fades like phosphor where you paint it.",
    rest: "loop",
    engine: phosphorEngine,
  }, el, options);
}

/** Crates riding a belt through a gate. Hovering slows the clock without stopping it. `intensity` slows it more. */
export function slow(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "slow",
    label: "Crates riding a belt through a gate. Hovering slows the clock without stopping it.",
    rest: "rate 1.00×",
    engine: slowEngine,
  }, el, options);
}

/** Blocks on a turntable. A flick across it spins it; it settles on the nearest quarter turn. `intensity` makes the spin coast longer. */
export function turntable(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "turntable",
    label: "Blocks on a turntable. Flick across it to spin it; it settles on the nearest quarter turn.",
    rest: "az 045° · el 30°",
    engine: turntableEngine,
  }, el, options);
}

/** A sixty-key board. The key under the pointer sinks, and its neighbours follow it down, less the further away. `intensity` widens how far the press reaches. */
export function keyboard(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "keyboard",
    label: "A sixty-key board. The key under the pointer sinks, and its neighbours follow it down, less the further away.",
    rest: "rest",
    engine: keyboardEngine,
  }, el, options);
}

/** Four floors beside an open shaft. The pointer's height picks a floor, and the car travels there through the ones between. `intensity` makes the car travel faster. */
export function elevator(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "elevator",
    label: "Four floors beside an open shaft. The pointer's height picks a floor, and the car travels there through the ones between.",
    rest: "rest",
    engine: elevatorEngine,
  }, el, options);
}

/** A phone in layers: glass, board, battery, shell. Moving across opens the gap; moving down picks a layer. `intensity` opens the layers further. */
export function phone(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "phone",
    label: "A phone in layers: glass, board, battery, shell. Moving across opens the gap; moving down picks a layer.",
    rest: "rest",
    engine: phoneEngine,
  }, el, options);
}

/** A thin laptop: the pointer's height sets how far the lid stands open, and the lid follows it on a spring. `intensity` lets the lid open wider. */
export function laptop(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "laptop",
    label: "A thin laptop: the pointer's height sets how far the lid stands open, and the lid follows it on a spring.",
    rest: "rest",
    engine: laptopEngine,
  }, el, options);
}

/** A terminal window: the pointer's height scrolls back through its history, and the line under it lifts off the screen. `intensity` spreads the lift over more lines. */
export function terminal(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "terminal",
    label: "A terminal window: the pointer's height scrolls back through its history, and the line under it lifts off the screen.",
    rest: "rest",
    engine: terminalEngine,
  }, el, options);
}

/** A rack of twelve blades: the pointer's height pulls the nearest ones out on their rails, the farther the less. `intensity` pulls out more blades. */
export function cabinet(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "cabinet",
    label: "A rack of twelve blades: the pointer's height pulls the nearest ones out on their rails, the farther the less.",
    rest: "rest",
    engine: cabinetEngine,
  }, el, options);
}

/** A commit graph on a board: the commit under the pointer rises, and its history rises after it, the farther back the less. `intensity` raises more of the history. */
export function branches(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "branches",
    label: "A commit graph on a board: the commit under the pointer rises, and its history rises after it, the farther back the less.",
    rest: "rest",
    engine: branchesEngine,
  }, el, options);
}

/** A vault door: circling the pointer turns its dial, which coasts and catches every ten; on forty its three bolts draw back. `intensity` lets the dial coast longer. */
export function vault(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "vault",
    label: "A vault door: circling the pointer turns its dial, which coasts and catches every ten; on forty its three bolts draw back.",
    rest: "rest",
    engine: vaultEngine,
  }, el, options);
}

/** A bank of twelve lockers, one ajar at rest: the locker under the pointer opens, and the one open before it swings shut. `intensity` opens the door wider. */
export function lockers(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "lockers",
    label: "A bank of twelve lockers, one ajar at rest: the locker under the pointer opens, and the one open before it swings shut.",
    rest: "rest",
    engine: lockersEngine,
  }, el, options);
}

/** A stand loupe over a blank ruled sheet: the pointer drags it across, and the rules pass enlarged under the glass with nothing between them. `intensity` magnifies more. */
export function loupe(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "loupe",
    label: "A stand loupe over a blank ruled sheet: the pointer drags it across, and the rules pass enlarged under the glass with nothing between them.",
    rest: "rest",
    engine: loupeEngine,
  }, el, options);
}

/** A padlock: as the pointer nears, the shackle springs up out of the body and swings open about its long leg. `intensity` swings the shackle further. */
export function padlock(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "padlock",
    label: "A padlock: as the pointer nears, the shackle springs up out of the body and swings open about its long leg.",
    rest: "rest",
    engine: padlockEngine,
  }, el, options);
}

/** A patch panel of twenty-four ports: the cable under the pointer lifts, and its neighbours lean away, less the further away. `intensity` spreads the lean over more ports. */
export function patch(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "patch",
    label: "A patch panel of twenty-four ports: the cable under the pointer lifts, and its neighbours lean away, less the further away.",
    rest: "rest",
    engine: patchEngine,
  }, el, options);
}

/** A parabolic dish on a two-axis gimbal: the pointer aims it, and it follows on a spring. `intensity` swings the dish further. */
export function dish(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "dish",
    label: "A parabolic dish on a two-axis gimbal: the pointer aims it, and it follows on a spring.",
    rest: "rest",
    engine: dishEngine,
  }, el, options);
}

/** A wifi router whose antennas lean toward the pointer, the nearest the most and the others less the further away. `intensity` spreads the lean over more antennas. */
export function router(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "router",
    label: "A wifi router whose antennas lean toward the pointer, the nearest the most and the others less the further away.",
    rest: "rest",
    engine: routerEngine,
  }, el, options);
}

/** Three test sieves stacked over a pan: the pointer's height picks one, it rises clear of the stack, and every mesh is bare. `intensity` opens the gap further. */
export function sieve(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "sieve",
    label: "Three test sieves stacked over a pan: the pointer's height picks one, it rises clear of the stack, and every mesh is bare.",
    rest: "rest",
    engine: sieveEngine,
  }, el, options);
}

/** A garment rail with seven bare hangers: the pointer brushes them, and each rocks away from it, the nearest most, and settles. `intensity` reaches more hangers. */
export function rail(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "rail",
    label: "A garment rail with seven bare hangers: the pointer brushes them, and each rocks away from it, the nearest most, and settles.",
    rest: "rest",
    engine: railEngine,
  }, el, options);
}

/** A wall socket and a plug lying on the floor at the end of its cord: the pointer draws the plug up toward the socket, and it stops short. `intensity` brings it nearer. */
export function plug(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "plug",
    label: "A wall socket and a plug lying on the floor at the end of its cord: the pointer draws the plug up toward the socket, and it stops short of it.",
    rest: "rest",
    engine: plugEngine,
  }, el, options);
}

/** A question mark built as a solid on a plinth, its dot a loose ball: the hook turns about its stem toward the pointer, and the ball rolls after it. `intensity` turns the hook further. */
export function query(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "query",
    label: "A question mark built as a solid on a plinth, its dot a loose ball: the hook turns about its stem toward the pointer, and the ball rolls after it.",
    rest: "rest",
    engine: queryEngine,
  }, el, options);
}

/** A filing cabinet of three drawers: the pointer's height picks one, it slides out, and inside are two dividers and nothing between them. `intensity` pulls the drawer further out. */
export function drawer(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "drawer",
    label: "A filing cabinet of three drawers: the pointer's height picks one, it slides out, and inside are two dividers and nothing between them.",
    rest: "rest",
    engine: drawerEngine,
  }, el, options);
}

/** An empty wire shopping basket under a bail handle: the pointer tilts it toward itself on a spring, so the bare floor shows, and the handle swings after it, late. `intensity` tilts it further. */
export function basket(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "basket",
    label: "An empty wire shopping basket under a bail handle: the pointer tilts it toward itself on a spring, so the bare floor shows, and the handle swings after it, late.",
    rest: "rest",
    engine: basketEngine,
  }, el, options);
}

/** A bar chart with no data: seven flat tabs on its base, before a plate of grid lines. The pointer brushes them, and each lifts a little, the nearest most, and drops back to zero. `intensity` lifts them higher. */
export function plot(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "plot",
    label: "A bar chart with no data: seven flat tabs on its base, before a plate of grid lines. The pointer brushes them, and each lifts a little, the nearest most, and drops back to zero.",
    rest: "rest",
    engine: plotEngine,
  }, el, options);
}

/** A hub and eight tiles on a grid: the tile under the pointer rises and its link turns solid, and its neighbours rise less. `intensity` raises the tiles higher. */
export function hub(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "hub",
    label: "A hub and eight tiles on a grid: the tile under the pointer rises and its link turns solid; its neighbours rise less.",
    rest: "rest",
    engine: hubEngine,
    tour: [[205, 112], [260, 144], [328, 179], [263, 207], [201, 243], [131, 209], [76, 177], [136, 141], null],
  }, el, options);
}

/** A hub and four branches of tiles: the path to the leaf under the pointer lights hop by hop, each tile rising in turn. `intensity` makes each hop wait longer. */
export function relay(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "relay",
    label: "A hub and four branches of tiles: the path to the leaf under the pointer lights hop by hop, each tile rising in turn.",
    rest: "rest",
    engine: relayEngine,
    tour: [[45, 145], [140, 253], [271, 258], [355, 216], [344, 151], null],
  }, el, options);
}

/** Twelve tiles lie crooked round a hub; as the pointer nears it they slide into a tree and the links draw in. `intensity` starts the tree from further away. */
export function settle(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "settle",
    label: "Twelve tiles lie crooked round a hub; as the pointer nears it they slide into a tree and the links draw in.",
    rest: "rest",
    engine: settleEngine,
    tour: [[360, 40], [320, 120], [203, 155], null],
  }, el, options);
}

/** A file of ten crooked lines: the pointer runs the formatter down it, and every line above snaps square to its indent. `intensity` starts the lines more crooked. */
export function format(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "format",
    label: "A file of ten crooked lines: the pointer runs the formatter down it, and every line above snaps square to its indent.",
    rest: "rest",
    engine: formatEngine,
    tour: [[290, 162], [199, 168], [135, 200], null],
  }, el, options);
}

/** A tree of package tiles: the one touched rises, and every package that depends on it rises after it along the links. `intensity` raises them higher. */
export function rebuild(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "rebuild",
    label: "A tree of package tiles: the one touched rises, and every package that depends on it rises after it along the links.",
    rest: "rest",
    engine: rebuildEngine,
    tour: [[47, 236], [276, 172], [181, 106], null],
  }, el, options);
}

/** A call stack of five frames: the pointer's height picks one, and the frames above lift away to open it. `intensity` lifts them further. */
export function stack(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "stack",
    label: "A call stack of five frames: the pointer's height picks one, and the frames above lift away to open it.",
    rest: "rest",
    engine: stackEngine,
    tour: [[200, 250], [200, 216], [200, 199], null],
  }, el, options);
}

/** A row of nine dominoes on a plinth. The pointer's place along the row is how far the fall has run, each domino lying on the next. `intensity` runs the fall faster. */
export function dominoes(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "dominoes",
    label: "A row of nine dominoes on a plinth. The pointer's place along the row is how far the fall has run, each domino lying on the next.",
    rest: "rest",
    engine: dominoesEngine,
    tour: [[270, 184], [220, 159], [165, 131], [140, 118], null],
  }, el, options);
}

/** A mixing desk of eight faders. The pointer takes the one it is over and sets its level; the faders beside it follow part of the way. `intensity` reaches more channels. */
export function faders(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "faders",
    label: "A mixing desk of eight faders. The pointer takes the one it is over and sets its level; the faders beside it follow part of the way.",
    rest: "rest",
    engine: fadersEngine,
    tour: [[180, 126], [188, 184], [290, 175], [192, 162], null],
  }, el, options);
}

/** Newton's cradle, clacking gently. The pointer draws an end ball out; let go, and the swing runs down to the gentle one. `intensity` draws the ball out further. */
export function cradle(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "cradle",
    label: "Newton's cradle, clacking gently. The pointer draws an end ball out; let go, and the swing runs down to the gentle one.",
    rest: "rest",
    engine: cradleEngine,
    tour: [[285, 226], [123, 146], [250, 208], null],
  }, el, options);
}

/** A metronome keeping time. The pointer's height slides the weight along the arm: higher is slower. `intensity` swings the arm wider. */
export function metronome(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "metronome",
    label: "A metronome keeping time. The pointer's height slides the weight along the arm: higher is slower.",
    rest: "rest",
    engine: metronomeEngine,
    tour: [[195, 112], [195, 180], [195, 140], null],
  }, el, options);
}

/** A desk globe turning slowly in its meridian ring. Moving across it drags the surface along; on leaving it coasts down to the slow turn. `intensity` lets it coast longer. */
export function globe(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "globe",
    label: "A desk globe turning slowly in its meridian ring. Moving across it drags the surface along; on leaving it coasts down to the slow turn.",
    rest: "rest",
    engine: globeEngine,
    tour: [[150, 140], [250, 140], [170, 150], null],
  }, el, options);
}

/** A standing desk with a lamp, a monitor, a keyboard and a mug. The pointer's height raises and lowers the top, and everything on it rides along. `intensity` lets the top travel further. */
export function desk(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "desk",
    label: "A standing desk with a lamp, a monitor, a keyboard and a mug. The pointer's height raises and lowers the top, and everything on it rides along.",
    rest: "rest",
    engine: deskEngine,
    tour: [[200, 105], [200, 225], [200, 160], null],
  }, el, options);
}

/** A desktop in use, on a display standing up. Over it the page cursor becomes the desktop cursor, the dock's icons swell under it, and the app it points at grows a window out of its icon and brings it to the front. `intensity` is how many windows stay open. */
export function desktop(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "desktop",
    label: "A display standing up, showing a desktop with a dock and open windows. The app under the pointer opens a window out of its dock icon and brings it to the front.",
    rest: "rest",
    engine: desktopEngine,
    tour: [[200, 208], [223, 213], [152, 199], [278, 172], null],
  }, el, options);
}

/** A suanpan lying flat. The pointer is a finger on one rod, pushing its beads to the beam; the beads that count are bright and the number goes to the read-out. `intensity` makes the beads snap harder. */
export function abacus(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "abacus",
    label: "A suanpan lying flat. The pointer is a finger on one rod, pushing its beads to the beam; the beads that count are bright and the number goes to the read-out.",
    rest: "rest",
    engine: abacusEngine,
    tour: [[160, 150], [220, 190], [200, 120], null],
  }, el, options);
}

/** A board of compass needles and one magnet. The pointer carries the magnet, and every needle within reach swings round to point at it and settles. `intensity` is the magnet's reach. */
export function compass(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "compass",
    label: "A board of compass needles and one magnet. The pointer carries the magnet, and every needle within reach swings round to point at it and settles.",
    rest: "rest",
    engine: compassEngine,
    tour: [[140, 150], [250, 150], [200, 120], null],
  }, el, options);
}

/** A sundial under a sun on its arc. Moving across is the day going by: the sun crosses the sky and the fin's shadow swings round the dial. `intensity` is the season, how high the sun stands at noon. */
export function sundial(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "sundial",
    label: "A sundial under a sun on its arc. Moving across is the day going by: the sun crosses the sky and the fin's shadow swings round the dial.",
    rest: "rest",
    engine: sundialEngine,
    tour: [[110, 160], [290, 160], [200, 160], null],
  }, el, options);
}

/** A sliding puzzle of eight tiles and a gap. The pointer pushes tiles toward the gap; on leaving, it takes every move back in turn. `intensity` makes the tiles slide more briskly. */
export function puzzle(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "puzzle",
    label: "A sliding puzzle of eight tiles and a gap. The pointer pushes tiles toward the gap; on leaving, it takes every move back in turn.",
    rest: "rest",
    engine: puzzleEngine,
    tour: [[240, 180], [160, 140], [200, 120], null],
  }, el, options);
}

/** An hourglass. The pointer turns it over, on arriving and each time it crosses the middle of the stage, and the sand runs down again. `intensity` makes the sand run faster. */
export function hourglass(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "hourglass",
    label: "An hourglass. The pointer turns it over, on arriving and each time it crosses the middle of the stage, and the sand runs down again.",
    rest: "rest",
    engine: hourglassEngine,
    tour: [[150, 160], [250, 160], null],
  }, el, options);
}

/** A stapler with a sheet of paper under its jaw. The pointer draws the sheet through, and the arm snaps down to leave a staple at every stitch. `intensity` sets the stitches closer. */
export function stapler(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "stapler",
    label: "A stapler with a sheet of paper under its jaw. The pointer draws the sheet through, and the arm snaps down to leave a staple at every stitch.",
    rest: "rest",
    engine: staplerEngine,
    tour: [[260, 125], [150, 200], [200, 160], null],
  }, el, options);
}

/** A zip-round pencil case. Going across, the pointer first undoes the zip, then lifts the lid on what lies inside. `intensity` opens the lid further back. */
export function pencilcase(el: HTMLElement, options?: HairlineOptions): Figure {
  return create({
    id: "pencilcase",
    label: "A zip-round pencil case. Going across, the pointer first undoes the zip, then lifts the lid on what lies inside.",
    rest: "rest",
    engine: pencilcaseEngine,
    tour: [[110, 160], [215, 160], [300, 160], null],
  }, el, options);
}
