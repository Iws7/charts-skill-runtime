# charts-skill-runtime

Versioned browser runtime for charts-skill (ECharts 6.0.0 based).

## CDN usage

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Iws7/charts-skill-runtime@v1.0.0-rc.1/dist/charts.v1.css">
<script src="https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Iws7/charts-skill-runtime@v1.0.0-rc.1/dist/chart-runtime.v1.js"></script>
```

ECharts 6.0.0 must be loaded before this runtime. The runtime exposes `ChartsSkill.mount(container, descriptor, status)` which returns `{resize, dispose}`.

Themes are defined in `dist/themes.v1.json` and compiled into chart descriptors by the Python entry point; the browser runtime only consumes the descriptor tokens.

Every published tag, including release-candidate tags, is immutable.
