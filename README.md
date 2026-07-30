# bklit-vue-charts

A **Vue 3** port of [bklit-ui](https://ui.bklit.com)'s charts. Composable
primitives built on **d3** (math) + **motion-v** (animation), rendered as
**SVG**, themed entirely with CSS variables.

Line, area, bar (grouped/stacked), funnel, and heatmap — plus grid, axes,
legend, tooltip, background patterns, brush zoom, and loading states.

## Install

```bash
npm install bklit-vue-charts@beta vue @vueuse/core motion-v
```

`vue`, `@vueuse/core`, and `motion-v` are peer dependencies.

```ts
import { LineChart, Line, Grid, XAxis, YAxis, ChartTooltip } from 'bklit-vue-charts'
import 'bklit-vue-charts/style.css' // component styles (required)
import 'bklit-vue-charts/theme.css' // default tokens (optional)
```

## Usage

```vue
<LineChart :data="data">
  <Grid horizontal />
  <Line data-key="users" stroke="var(--chart-line-primary)" />
  <Line data-key="pageviews" stroke="var(--chart-line-secondary)" />
  <XAxis />
  <YAxis />
  <ChartTooltip />
</LineChart>
```

Data is an array of rows with a date/category key plus numeric series. Series
come solely from the `<Line>`/`<Area>`/`<Bar>` children — there is no `yKeys`
prop.

```ts
const data = [
  { date: new Date('2025-01-01'), users: 1200, pageviews: 4500 },
  { date: new Date('2025-01-02'), users: 1350, pageviews: 4800 }
]
```

`AreaChart` and `BarChart` work the same way with `<Area>` / `<Bar>` children;
`BarChart` uses `<BarXAxis>` and accepts `stacked` + `stack-gap`.

`FunnelChart` and `HeatmapChart` are standalone:

```vue
<FunnelChart :data="stages" color="var(--chart-1)" :layers="3" />
<HeatmapChart :data="weeks" />
```

## Composition pieces

Drop these inside a chart — they read the chart context. `Legend` and HTML
chrome go in the `#overlay` slot; `ChartBrush` renders in the plot.

| Component       | What it does                                                                        |
| --------------- | ----------------------------------------------------------------------------------- |
| `Grid`          | horizontal/vertical grid lines, edge fade, break-even `highlight-row-values`        |
| `XAxis`         | date tick labels for time-series charts; fade under the tooltip pill                |
| `BarXAxis`      | one category label per bar, thinned to `max-labels`; fade under the tooltip pill    |
| `YAxis`         | value labels; `orientation="left"\|"right"`, compact `12k` formatting               |
| `ChartTooltip`  | crosshair + per-series dots + content panel + rolling date pill                     |
| `Legend`        | series markers + labels; hover dims the others, click toggles a series              |
| `Background`    | pattern fill (`diagonal`/`horizontal`/`vertical`/`cross`/`dots`/`circles`/`accent`) |
| `ChartBrush`    | in-chart brush overlay; emits a `{ start, end }` date selection                     |
| `ReferenceArea` | shaded band between `y1`/`y2` and/or `x1`/`x2`                                      |

## Theming

Charts read `--chart-*` CSS variables. Import `bklit-vue-charts/theme.css` for
the full default set, or define your own on `:root`:

```css
:root {
  --chart-background: oklch(1 0 0);
  --chart-foreground: oklch(0.145 0.004 285);
  --chart-label: oklch(0.55 0.014 260);
  --chart-line-primary: oklch(0.32 0.008 80);
  --chart-line-secondary: oklch(0.6 0.012 75);
  --chart-crosshair: oklch(0.45 0.01 275);
  --chart-grid: oklch(0.9 0 0);
  --chart-tooltip-background: oklch(0.21 0.006 285 / 0.8);
  --chart-tooltip-foreground: oklch(0.985 0 0);
  --chart-1: var(--chart-line-primary); /* funnel */
  --chart-scale-01: oklch(0.98 0.003 106); /* heatmap ramp, 01–05 */
}
```

Color props (`stroke`, `fill`, …) accept CSS variables too. The root chart sizes
to its container width via `aspectRatio` (default `2 / 1`).

## Loading & empty states

```vue
<LineChart :data="data" :status="isLoading ? 'loading' : 'ready'" loading-label="Loading…">
```

`status="loading"` shows a skeleton pulse and grid shimmer. When `data` is empty
and not loading, the chart shows `emptyLabel` (default `"No data"`).

## Brush zoom

`ChartBrush` reads its chart's `xScale` and emits a `{ start, end }` selection
(v-model). Host it in a full-extent strip chart and feed the selection into the
main chart's `xDomain`:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChartBrushSelection } from 'bklit-vue-charts'

const selection = ref<ChartBrushSelection | null>(null)
const domain = computed(() =>
  selection.value ? [selection.value.start, selection.value.end] : undefined
)
</script>

<template>
  <LineChart :data="data" :x-domain="domain">
    <Line data-key="users" :animate="false" />
    <XAxis />
  </LineChart>

  <LineChart :data="data" aspect-ratio="10 / 1">
    <Line data-key="users" :animate="false" />
    <ChartBrush v-model="selection" />
  </LineChart>
</template>
```

## API reference

### Root charts — `LineChart` / `AreaChart` / `BarChart`

| Prop                   | Type                           | Default                      |
| ---------------------- | ------------------------------ | ---------------------------- |
| `data`                 | `Record<string, unknown>[]`    | required                     |
| `xDataKey`             | `string`                       | `"date"` (`"month"` for Bar) |
| `margin`               | `{ top, right, bottom, left }` | `40` all sides               |
| `aspectRatio`          | `string`                       | `"2 / 1"`                    |
| `animationDuration`    | `number`                       | `1100`                       |
| `status`               | `"loading" \| "ready"`         | `"ready"`                    |
| `loadingLabel`         | `string`                       | `""`                         |
| `emptyLabel`           | `string`                       | `"No data"`                  |
| `xDomain`              | `[Date, Date]`                 | — (Line/Area only)           |
| `stacked` / `stackGap` | `boolean` / `number`           | `false` / `0` (Bar only)     |

`AreaChart` is an alias for `LineChart`.

### Axes — `XAxis` / `BarXAxis`

- **XAxis** (time series) — `num-ticks` (5), `tick-mode` (`"data" | "domain"`), `ticker-half-width` (50)
- **BarXAxis** (bar band scale) — `max-labels` (12), `show-all-labels` (false), `ticker-half-width` (50)

### Series — `Line` / `Area` / `Bar`

Common: `data-key` (required), `y-axis-id`, `stroke`/`fill`, `animate`.

- **Line** — `stroke-width` (2.5), `curve`, `fade-edges` (true), `show-highlight` (true), `show-markers` + `markers`, `dash-from-index` + `dash-array`
- **Area** — `fill-opacity` (0.4), `gradient-to-opacity` (0), `gradient-span`, `show-line` (true), `fade-edges` (false), `curve`, `show-markers` + `markers`
- **Bar** — `line-cap` (`"round" | "butt" | number`), `animation-type` (`"grow" | "fade"`), `stagger-delay`, `min-bar-height`, `faded-opacity`, `group-gap`

### `useChart()`

Any component inside a chart can read the context:

```ts
import { useChart } from 'bklit-vue-charts'
const { xScale, getYScale, innerWidth, innerHeight, hover, series } = useChart()
```

## License

MIT — see [LICENSE](./LICENSE). Ported from [bklit-ui](https://ui.bklit.com)
(React/visx, MIT © uixmat), rebuilt on d3 + motion-v with
[VueUse](https://vueuse.org).
