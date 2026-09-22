(function (global) {
  'use strict';
  const handles = new Set();
  function format(value, d) {
    if (value === null || value === undefined) return '缺失';
    const n = d.scale === 'fraction' ? value * 100 : value;
    return Number(n).toLocaleString('zh-CN', {maximumFractionDigits: 8}) + (d.unit === '无量纲' ? '' : d.unit);
  }
  function formatAs(value, unit, scale) {
    if (value === null || value === undefined) return '缺失';
    const n = scale === 'fraction' ? value * 100 : value;
    return Number(n).toLocaleString('zh-CN', {maximumFractionDigits: 8}) + (unit === '无量纲' ? '' : unit);
  }
  function option(d) {
    const horizontal = d.orientation === 'horizontal';
    const colors = Array.from({length: 8}, (_, i) => d.tokens['chart-series-' + (i + 1)]);
    const multiline = d.chartType === 'line' && d.seriesNames.length > 0;
    const combo = d.chartType === 'combo';
    const comboGrouped = combo && d.seriesNames.length > 0;
    const grouped = d.chartType === 'grouped_bar' || d.chartType === 'stacked_bar' || multiline || comboGrouped;
    const categories = grouped || combo ? Array.from(new Set(d.points.map(p => p[0]))) : d.points.map(p => p[0]);
    const values = d.points.map(p => p[1]);
    const category = {type: 'category', data: categories, inverse: horizontal,
      axisLabel: {color: d.tokens['ink-muted'], width: horizontal ? 115 : 85, overflow: 'truncate', interval: horizontal ? 0 : 'auto', hideOverlap: false},
      axisTick: {show: false}, axisLine: {lineStyle: {color: d.tokens['border-strong']}}};
    const value = {type: 'value', name: '', splitNumber: 4, axisLabel: {hideOverlap: true, color: d.tokens['ink-muted'], formatter: v => format(v, d)},
      splitLine: {lineStyle: {color: d.tokens['border-strong']}}, scale: d.chartType === 'line' || d.chartType === 'scatter'};
    const result = {
      color: colors, animation: false,
      aria: {enabled: true},
      tooltip: {trigger: 'axis', renderMode: 'richText', formatter: params => {
        const p = params[0]; return categories[p.dataIndex] + '\n' + params.map(p => p.seriesName + '：' + format(p.value, d)).join('\n');
      }},
      grid: {left: 18, right: 35, top: 45, bottom: categories.length > 12 ? 70 : 35, containLabel: true},
      xAxis: horizontal ? value : category,
      yAxis: horizontal ? category : value,
      series: [{type: d.chartType === 'area' ? 'line' : d.chartType, name: d.valueLabel, data: values, connectNulls: false,
        smooth: false, symbolSize: 7, barMaxWidth: 36,
        labelLayout: {hideOverlap: true},
        label: {show: d.showLabel, position: horizontal ? 'right' : 'top', formatter: p => format(p.value, d)},
        itemStyle: {color: colors[0]}}]
    };
    if (d.chartType === 'diverging_bar') {
      result.series[0].type = 'bar';
      result.series[0].itemStyle = {color: p => p.value > 0 ? d.tokens['semantic-up'] : p.value < 0 ? d.tokens['semantic-down'] : d.tokens['ink-muted']};
      const extent = Math.max(1, ...values.filter(v => v !== null).map(Math.abs));
      result.xAxis.min = -extent * 1.15; result.xAxis.max = extent * 1.15;
      result.series[0].markLine = {silent: true, symbol: 'none', label: {show: false}, data: [{xAxis: 0}], lineStyle: {color: d.tokens['ink-muted'], type: 'solid'}};
    }
    if (d.chartType === 'dumbbell') {
      result.legend = {top: 0, data: [d.valueLabel, d.secondLabel]};
      result.series = [{type: 'custom', name: '配对区间', data: d.points.map((p, i) => [i, p[1], p[2]]), encode: {x: [1, 2], y: 0},
        renderItem: (params, api) => {
          const a = api.coord([api.value(1), api.value(0)]), b = api.coord([api.value(2), api.value(0)]);
          if (a[1] < params.coordSys.y || a[1] > params.coordSys.y + params.coordSys.height) return null;
          return {type: 'line', shape: {x1: a[0], y1: a[1], x2: b[0], y2: b[1]}, style: {stroke: d.tokens['border-strong'], lineWidth: 4}};
        }},
        ...[1, 2].map((idx, j) => ({type: 'scatter', name: j ? d.secondLabel : d.valueLabel,
          data: d.points.map(p => [p[idx], p[0]]), symbol: j ? 'diamond' : 'circle', symbolSize: j ? 11 : 14,
          itemStyle: {color: j ? colors[1] : '#fff', borderColor: colors[j], borderWidth: 2},
          label: {show: d.showLabel, position: j ? 'bottom' : 'top', formatter: p => format(p.value[0], d)}, labelLayout: {hideOverlap: true}}))];
      result.tooltip = {trigger: 'axis', renderMode: 'richText', formatter: params => {
        const p = d.points[params[0].dataIndex];
        return p[0] + '\n' + d.valueLabel + '：' + format(p[1], d) + '\n' + d.secondLabel + '：' + format(p[2], d);
      }};
    }
    if (d.chartType === 'progress') {
      result.legend = {top: 0, data: [d.valueLabel, d.secondLabel]};
      result.xAxis.max = Math.max(...d.points.flatMap(p => [p[1], p[2]])) * 1.35;
      result.series = [
        {type: 'bar', name: d.secondLabel, data: d.points.map(p => p[2]), barWidth: 24, barGap: '-100%', itemStyle: {color: d.tokens['surface-muted']}, silent: true},
        {type: 'bar', name: d.valueLabel, data: values, barWidth: 12, itemStyle: {color: colors[0]}, z: 2,
          label: {show: true, position: 'right', formatter: p => (p.value / d.points[p.dataIndex][2] * 100).toLocaleString('zh-CN', {maximumFractionDigits: 2}) + '%'}, labelLayout: {hideOverlap: true}},
        {type: 'scatter', name: '目标位置', data: d.points.map(p => [p[2], p[0]]), symbol: 'rect', symbolSize: [3, 27], itemStyle: {color: d.tokens['ink-muted']}, z: 3}
      ];
      result.tooltip = {trigger: 'axis', renderMode: 'richText', formatter: params => {
        const p = d.points[params[0].dataIndex];
        return p[0] + '\n' + d.valueLabel + '：' + format(p[1], d) + '\n' + d.secondLabel + '：' + format(p[2], d) + '\n完成率：' + (p[1] / p[2] * 100).toFixed(2) + '%';
      }};
    }
    if (d.chartType === 'heatmap' || d.chartType === 'dot_heatmap') {
      const xs = Array.from(new Set(d.points.map(p => p[0]))), ys = Array.from(new Set(d.points.map(p => p[2])));
      const cells = d.points.map(p => [xs.indexOf(p[0]), ys.indexOf(p[2]), p[1]]);
      const known = cells.filter(p => p[2] !== null), missing = cells.filter(p => p[2] === null).map(p => [p[0], p[1], 0]);
      const extent = Math.max(...known.map(p => Math.abs(p[2]))) || 1;
      const diverging = d.semantics.colorMode === 'diverging';
      const isDot = d.chartType === 'dot_heatmap';
      const tooltip = p => xs[p.value[0]] + ' / ' + ys[p.value[1]] + '\n' + (p.seriesName === '缺失' ? '缺失' : format(p.value[2], d));
      return {animation: false, aria: {enabled: true},
        grid: {left: 10, right: 25, top: 30, bottom: 85, containLabel: true},
        xAxis: {...category, data: xs, inverse: false, splitArea: {show: true}},
        yAxis: {...category, data: ys, inverse: true, splitArea: {show: true}},
        tooltip: {trigger: 'item', renderMode: 'richText', formatter: tooltip},
        visualMap: {min: diverging ? -extent : 0, max: extent, dimension: 2, seriesIndex: 0,
          orient: 'horizontal', left: 'center', bottom: 0, calculable: false, precision: 2,
          text: ['高', '低'], inRange: {color: diverging ? [d.tokens['semantic-down'], '#f5f5f3', d.tokens['semantic-up']] : ['#eaf1fb', colors[0]]}},
        series: [
          {type: isDot ? 'scatter' : 'heatmap', name: d.valueLabel, data: known,
            symbolSize: v => v[2] === 0 ? 0 : Math.sqrt(v[2] / extent) * Math.min(30, 200 / Math.max(xs.length, ys.length)),
            label: {show: !isDot || d.showLabel, position: isDot ? 'top' : 'inside', formatter: p => format(p.value[2], d)},
            labelLayout: {hideOverlap: true}, itemStyle: {borderColor: '#fff', borderWidth: 2}},
          {type: isDot ? 'scatter' : 'heatmap', name: '缺失', data: missing, symbol: 'rect', symbolSize: 8,
            itemStyle: {color: d.tokens['surface-muted'], borderColor: d.tokens['border-strong'], borderWidth: 1},
            label: {show: true, formatter: '缺失', color: d.tokens['ink-muted']}},
          ...(isDot ? [{type: 'scatter', name: '零值', data: known.filter(p => p[2] === 0), symbolSize: 1,
            itemStyle: {opacity: 0}, label: {show: true, formatter: '0', color: d.tokens['ink-muted']}}] : [])
        ]};
    }
    if (d.chartType === 'treemap') {
      const roots = d.points.filter(p => p[3] === null);
      const nodes = roots.map((p, i) => ({id: p[2], name: p[0], value: p[1], itemStyle: {color: colors[i]},
        children: d.points.filter(c => c[3] === p[2]).map(c => ({id: c[2], name: c[0], value: c[1], itemStyle: {color: colors[i]}}))}));
      return {animation: false, aria: {enabled: true}, tooltip: {trigger: 'item', renderMode: 'richText', formatter: p =>
        p.treePathInfo.filter(n => n.name && n.name !== d.valueLabel).map(n => n.name).join(' / ') + '\n' + format(p.value, d)},
        series: [{type: 'treemap', name: d.valueLabel, data: nodes, roam: false, nodeClick: false, breadcrumb: {show: false},
          top: 8, bottom: 8, left: 8, right: 8, label: {show: true, overflow: 'truncate', formatter: p => p.name + '\n' + format(p.value, d)},
          upperLabel: {show: true, height: 28}, itemStyle: {borderColor: '#fff', borderWidth: 2, gapWidth: 3},
          levels: [{itemStyle: {borderWidth: 0}, upperLabel: {show: false}}, {itemStyle: {borderWidth: 3}, upperLabel: {show: true}}, {upperLabel: {show: false}}]}]};
    }
    if (d.chartType === 'area') result.series[0].areaStyle = {opacity: 0.18};
    if (grouped && !combo) {
      result.legend = {type: 'scroll', top: 0};
      result.series = d.seriesNames.map((name, index) => {
        const lookup = new Map(d.points.filter(p => p[2] === name).map(p => [p[0], p[1]]));
        const series = {type: multiline ? 'line' : 'bar', name, data: categories.map(c => lookup.get(c)),
          connectNulls: false, smooth: false, symbol: ['circle','rect','triangle','diamond','roundRect','pin','arrow','emptyCircle'][index], symbolSize: 7,
          barMaxWidth: 36, itemStyle: {color: colors[index]},
          label: {show: d.showLabel, formatter: p => format(p.value, d)}};
        series.labelLayout = {hideOverlap: true};
        if (d.chartType === 'stacked_bar') series.stack = 'total';
        return series;
      });
    }
    if (d.chartType === 'pie' || d.chartType === 'donut') {
      return {animation: false, color: colors, aria: {enabled: true},
        legend: {type: 'scroll', bottom: 0},
        tooltip: {trigger: 'item', renderMode: 'richText', formatter: p => p.name + '\n' + format(p.value, d) + '\n占所示整体 ' + p.percent + '%'},
        series: [{type: 'pie', radius: d.chartType === 'donut' ? ['38%', '64%'] : '64%', center: ['50%', '44%'],
          data: d.points.map(p => ({name: p[0], value: p[1]})),
          label: {show: true, width: 120, overflow: 'truncate', formatter: p => p.name + '\n' + format(p.value, d)},
          emphasis: {scale: false}, avoidLabelOverlap: true}]};
    }
    if (d.chartType === 'scatter') {
      result.xAxis = {type: 'value', name: d.xUnit, scale: true, splitLine: {lineStyle: {color: d.tokens['border-strong']}}};
      result.series = [{type: 'scatter', name: d.valueLabel, data: d.points, symbolSize: 10, itemStyle: {color: colors[0]}}];
      result.tooltip = {trigger: 'item', renderMode: 'richText', formatter: p => d.xLabel + '：' + p.value[0] + d.xUnit + '\n' + d.valueLabel + '：' + format(p.value[1], d)};
      return result;
    }
    if (d.chartType === 'waterfall') {
      let running = 0;
      const steps = d.points.map((p, index) => {
        const from = p[2] === 'delta' ? running : 0;
        const to = p[2] === 'delta' ? running + p[1] : p[1];
        running = to;
        return [index, from, to, p[1]];
      });
      result.series = [{type: 'custom', name: d.valueLabel, data: steps, encode: {x: 0, y: [1, 2]},
        renderItem: (params, api) => {
          const index = api.value(0), start = api.coord([index, api.value(1)]), end = api.coord([index, api.value(2)]);
          const width = Math.min(36, api.size([1, 0])[0] * 0.65);
          const rect = global.echarts.graphic.clipRectByRect({x: start[0] - width / 2, y: Math.min(start[1], end[1]), width,
            height: Math.max(1, Math.abs(end[1] - start[1]))}, params.coordSys);
          const color = d.points[index][2] === 'delta' ? (api.value(3) > 0 ? d.tokens['semantic-up'] : api.value(3) < 0 ? d.tokens['semantic-down'] : d.tokens['ink-muted']) : colors[0];
          if (!rect) return null;
          const children = [{type: 'rect', shape: rect, style: {fill: color}}];
          if (index < steps.length - 1) {
            const next = api.coord([index + 1, api.value(2)]);
            children.push({type: 'line', shape: {x1: end[0] + width / 2, y1: end[1], x2: next[0] - width / 2, y2: next[1]}, style: {stroke: d.tokens['ink-muted'], lineWidth: 1, lineDash: [4, 3]}});
          }
          if (d.showLabel) children.push({type: 'text', style: {x: start[0], y: Math.min(start[1], end[1]) - 8,
            text: format(api.value(3), d), align: 'center', verticalAlign: 'bottom', fill: d.tokens['ink-strong'], fontSize: 11}});
          return {type: 'group', children};
        }}];
      result.tooltip = {trigger: 'axis', renderMode: 'richText', formatter: params => {
        const index = params[0].value[0], p = d.points[index];
        return p[0] + '\n' + format(p[1], d) + '\n累计：' + format(steps[index][2], d);
      }};
    }
    if (combo) {
      const lineColor = d.tokens['brand-primary'];
      const barAxis = {...value, axisLabel: {hideOverlap: true, color: d.tokens['ink-muted'], formatter: v => formatAs(v, d.unit, d.scale)}};
      const lineAxis = {...value, axisLabel: {hideOverlap: true, color: d.tokens['ink-muted'], formatter: v => formatAs(v, d.y2Unit, d.y2Scale)},
        splitLine: {show: false}, scale: true};
      const lineLookup = new Map();
      for (const p of d.points) {
        const key = p[0];
        if (lineLookup.has(key) && lineLookup.get(key) !== p[2]) {
          throw new Error('分组组合图同一类别的折线值不一致');
        }
        if (!lineLookup.has(key)) lineLookup.set(key, p[2]);
      }
      let barSeries;
      if (comboGrouped) {
        barSeries = d.seriesNames.map((name, index) => {
          const lookup = new Map(d.points.filter(p => p[3] === name).map(p => [p[0], p[1]]));
          return {type: 'bar', name, yAxisIndex: 0, data: categories.map(c => lookup.get(c)),
            barMaxWidth: 36, itemStyle: {color: colors[index]},
            label: {show: d.showLabel, formatter: p => formatAs(p.value, d.unit, d.scale)}, labelLayout: {hideOverlap: true}};
        });
      } else {
        const lookup = new Map(d.points.map(p => [p[0], p[1]]));
        barSeries = [{type: 'bar', name: d.valueLabel, yAxisIndex: 0, data: categories.map(c => lookup.get(c)),
          barMaxWidth: 36, itemStyle: {color: colors[0]},
          label: {show: d.showLabel, position: 'top', formatter: p => formatAs(p.value, d.unit, d.scale)}, labelLayout: {hideOverlap: true}}];
      }
      const lineSeries = {type: 'line', name: d.secondLabel, yAxisIndex: 1, data: categories.map(c => lineLookup.get(c)),
        connectNulls: false, smooth: false, symbol: 'circle', symbolSize: 7,
        lineStyle: {width: 2, color: lineColor}, itemStyle: {color: lineColor},
        label: {show: false}, labelLayout: {hideOverlap: true}, z: 3};
      result.yAxis = [barAxis, lineAxis];
      result.series = [...barSeries, lineSeries];
      result.legend = {type: 'scroll', top: 0};
      result.grid = {...result.grid, right: 55};
      result.tooltip = {trigger: 'axis', renderMode: 'richText', formatter: params => {
        const idx = params[0].dataIndex;
        const lines = [categories[idx]];
        for (const p of params) {
          const isLine = p.seriesIndex === barSeries.length;
          const v = isLine ? formatAs(p.value, d.y2Unit, d.y2Scale) : formatAs(p.value, d.unit, d.scale);
          lines.push(p.marker + p.seriesName + '：' + v);
        }
        return lines.join('\n');
      }};
    }
    if (categories.length > 12) result.dataZoom = [{type: 'slider',
      [horizontal ? 'yAxisIndex' : 'xAxisIndex']: 0, startValue: 0, endValue: 11, filterMode: 'none'}];
    return result;
  }
  function mount(container, descriptor, status) {
    let instance = null, observer = null, disposed = false;
    function fail(error) {
      if (instance) { instance.dispose(); instance = null; }
      container.dataset.status = 'error';
      container.textContent = '图表绘制失败：' + error.message;
    }
    function resize() {
      if (disposed || !container.clientWidth || !container.clientHeight) return;
      try {
        if (!global.echarts) throw new Error('ECharts 资源未加载');
        if (!instance) {
          container.textContent = '';
          instance = global.echarts.init(container, null, {renderer: 'svg'});
          instance.setOption(option(descriptor));
          container.dataset.status = 'ready';
        } else instance.resize();
      } catch (error) { fail(error); }
    }
    const handle = {resize, dispose() {
      disposed = true;
      if (observer) observer.disconnect();
      global.removeEventListener('resize', resize);
      if (instance) instance.dispose();
      instance = null; handles.delete(handle); container.dataset.status = 'disposed';
    }};
    if (status === 'empty') {
      container.textContent = descriptor.emptyReason;
      container.dataset.status = 'empty';
      return handle;
    }
    container.dataset.status = 'pending';
    resize();
    if (global.ResizeObserver) { observer = new ResizeObserver(resize); observer.observe(container); }
    else global.addEventListener('resize', resize);
    handles.add(handle);
    return handle;
  }
  global.ChartsSkill = {mount, format};
  global.addEventListener('pagehide', () => Array.from(handles).forEach(h => h.dispose()));
  const payload = document.getElementById('chart-payload');
  if (payload) {
    try {
      JSON.parse(payload.textContent).forEach(r => {
        const d = r.descriptor;
        Object.entries(d.tokens).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));
        mount(document.getElementById(d.chartId), d, r.status);
      });
    } catch (error) {
      document.querySelectorAll('.chart').forEach(node => { node.dataset.status = 'error'; node.textContent = '图表数据加载失败：' + error.message; });
    }
  }
})(window);
