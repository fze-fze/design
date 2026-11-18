# hairline-local

等距线稿、会回应指针的图形组件库。33 个来自开源的 [hairline](https://github.com/lucasmarkes/hairline)（MIT），外加 14 个自己画的：
`dominoes`（多米诺）、`faders`（调音台推子）、`cradle`（牛顿摆）、`metronome`（节拍器）、`globe`（地球仪）、`desk`（升降桌）、`desktop`（电脑桌面）、`abacus`（算盘）、`compass`（磁针阵）、`sundial`（日晷）、`puzzle`（滑块拼图）、`hourglass`（沙漏）、`stapler`（订书机）、`pencilcase`（笔袋）。零运行时依赖，React 为可选。

## 预览

```sh
npm install
npm run dev        # 打开 gallery，直接从 src 读，改图形即时刷新
```

`?only=<id>` 只看一个图形（如 `/?only=cradle`），`&theme=dark`、`&play`、`&intensity=0.8` 可叠加。

## 在别的项目里用

```sh
npm run build                      # 产出 dist/（ESM + 类型）
npm i /Users/fze/Documents/fze/code/design   # 在目标项目里，按本地路径安装
```

```tsx
import { Cradle } from "hairline-local/react";
<Cradle intensity={0.7} play />
```

```ts
import { cradle } from "hairline-local";
const figure = cradle(el, { play: true });
figure.update({ intensity: 0.8 });
figure.destroy();
```

五个选项所有图形通用：`intensity`（0–1）、`theme`（auto/light/dark）、`label`、`onRead`、`play`。
主题用六个 CSS 变量：`--hairline-plate / hi / edge / mid / lo / stroke`，其中 `--hairline-plate` 要等于图形所在的背景色。
完整说明见 `upstream/README.md`。

## 结构

```
src/core/        引擎：投影与实体（iso）、弹簧与缓动（motion）、SVG/帧循环/指针（stage）、样式（styles）
src/figures/     每个图形一个文件，导出 mount
src/index.ts     原生入口，每个图形一个函数
src/react.tsx    React 入口
src/intensity.ts 每个图形的 intensity → 自身参数对照表
gallery/         预览页（catalog.ts 是分栏与中文说明）
skills/          上游的 hairline-create 技能：十条规则（rules.md）与自查清单（look.md）
```

## 再加一个图形

1. 新建 `src/figures/<name>.ts`，导出 `mount: FigureMount`（照 `faders.ts` 抄结构：`Cam`/`fit`/`proj` → 由远到近建 solid → `register` 一个 tick → `pointer` → `disposer`）。
2. `src/intensity.ts`：把 id 加进 `FigureId`，在 `TABLE` 写 intensity 为 0 / 0.5 / 1 时的三个值。
3. `src/index.ts` 加函数（`tour` 是自动演示时指针依次停的 viewBox 坐标），`src/react.tsx` 加组件。
4. `gallery/catalog.ts` 加一条。

画之前读一遍 `skills/hairline-create/rules.md`：命中区不动、高亮只用描边、静止态要有构图、由远到近绘制、不在图里写字。

来源与许可见 `NOTICE.md`。
