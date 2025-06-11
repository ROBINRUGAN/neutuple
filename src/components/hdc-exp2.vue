<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">
    平均内存查询
  </div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 320px"
    :style="{
      opacity: globalStore.isStarted ? 1 : 0
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

// --- 1. 响应式状态定义 ---

const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
const globalStore = useGlobalStore()

const selectedSize = ref<string>(globalStore.ruleScale)
let intervalId: number | null = null

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
  globalStore.registerRefreshFunction('neuexp2', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('neuexp2', () => {
    selectedSize.value = 'null'
  })

  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value)
    myChart.setOption(chartOptions.value)
    startDataFluctuation()
  }
})

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  stopDataFluctuation()
})

watchEffect(() => {
  window.addEventListener('resize', () => {
    myChart?.resize()
  })
})

// --- 3. 图表数据 ---

// ✨ 1. 更新为与图片完全匹配的精确数据
const originalData = {
  '1k': [
    { category: 'ACL', NeuTree: 23, TabTree: 18, NuevoMatch: 30, CutSplit: 18, KickTree: 18, PSTSS: 200 },
    { category: 'FW', NeuTree: 25, TabTree: 11, NuevoMatch: 22, CutSplit: 17, KickTree: 20, PSTSS: 180 },
    { category: 'IPC', NeuTree: 31, TabTree: 53, NuevoMatch: 32, CutSplit: 17, KickTree: 49, PSTSS: 220 }
  ],
  '10k': [
    { category: 'ACL', NeuTree: 33, TabTree: 21, NuevoMatch: 28, CutSplit: 25, KickTree: 49, PSTSS: 230 },
    { category: 'FW', NeuTree: 16, TabTree: 8, NuevoMatch: 20, CutSplit: 25, KickTree: 9, PSTSS: 180 },
    { category: 'IPC', NeuTree: 28, TabTree: 24, NuevoMatch: 34, CutSplit: 25, CutSplit_Outlier: 490, KickTree: 47, PSTSS: 490 }
  ],
  '100k': [
    { category: 'ACL', NeuTree: 30, TabTree: 18, NuevoMatch: 28, CutSplit: 25, KickTree: 40, PSTSS: 220 },
    { category: 'FW', NeuTree: 29, TabTree: 20, NuevoMatch: 31, CutSplit: 32, KickTree: 40, PSTSS: 150 },
    { category: 'IPC', NeuTree: 29, TabTree: 28, NuevoMatch: 30, CutSplit: 30, KickTree: 39, PSTSS: 220 }
  ]
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

const algorithms = ['NeuTree', 'TabTree', 'NuevoMatch', 'CutSplit', 'KickTree', 'PSTSS']
const allSeriesForUpdate = [...algorithms, 'CutSplit_Outlier']

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const sizeKey = key as keyof typeof originalData
      liveData.value[sizeKey] = originalData[sizeKey].map((item) => {
        const newItem = { ...item } as { [key: string]: any }
        algorithms.forEach((algo) => {
          if (item[algo as keyof typeof item] !== null) {
            const originalValue = item[algo as keyof typeof item] as number
            const multiplier = 0.98 + Math.random() * 0.04
            newItem[algo] = parseFloat((originalValue * multiplier).toFixed(2))
          }
        })
        return newItem
      })
    }
  }, 800)
}

function stopDataFluctuation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const currentChartData = computed(() => {
  if (!globalStore.isStarted || !liveData.value[selectedSize.value]) {
    return []
  }
  return liveData.value[selectedSize.value]
})

// --- 4. ECharts 配置项 ---

const chartOptions = computed(() => {
  const categories = currentChartData.value.map((item: { category: string }) => item.category)

  const series = algorithms.map((algo) => {
    let color, symbol, lineStyle
    let yAxisIndex = 0 // 默认在左侧Y轴

    // 系列样式以匹配原图
    switch (algo) {
      case 'NeuTree':
        color = '#d72a2b'; symbol = 'star'; lineStyle = { type: 'solid' }; break
      case 'TabTree':
        color = '#e69a45'; symbol = 'circle'; lineStyle = { type: 'dashed' }; break
      case 'NuevoMatch':
        color = '#68a43c'; symbol = 'emptyCircle'; lineStyle = { type: 'dashdot' }; break
      case 'CutSplit':
        color = '#387ee8'; symbol = 'circle'; lineStyle = { type: 'dotted' }; break
      case 'KickTree':
        color = '#888888'; symbol = 'pentagon'; lineStyle = { type: 'dotted' }; break
      case 'PSTSS':
        color = '#2ca9e1'; symbol = 'triangle'; lineStyle = { type: 'dotted' }; yAxisIndex = 1; break // ✨ 分配到右侧Y轴
    }

    return {
      name: algo,
      type: 'line',
      symbol: symbol,
      symbolSize: 8,
      lineStyle: lineStyle,
      itemStyle: { color },
      yAxisIndex: yAxisIndex,
      data: currentChartData.value.map(
        (item: { [x: string]: any }) => item[algo as keyof typeof item] ?? null
      )
    }
  })
  
  // ✨ 3. 添加一个独立的、不可见的系列来专门绘制CutSplit的异常点
  // series.push({
  //   name: 'CutSplit_Outlier', // 内部名称，用于数据更新
  //   type: 'scatter',         // 使用散点图只绘制一个点
  //   showInLegend: false,     // 不在图例中显示
  //   symbol: 'circle',
  //   symbolSize: 8,
  //   itemStyle: { color: '#387ee8' }, // 与CutSplit颜色一致
  //   yAxisIndex: 1, // 绘制在右侧Y轴上
  //   data: currentChartData.value.map(
  //     (item: { [x: string]: any }) => item['CutSplit_Outlier'] ?? null
  //   )
  // })

  return {
    animation: true,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 12 },
      data: algorithms.map((algo) => ({
        name: algo,
        icon: series.find((s) => s.name === algo)?.symbol || 'circle'
      }))
    },
    grid: { top: '5%', left: '7%', right: '7%', bottom: '22%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      name: `Ruleset Type`,
      nameLocation: 'middle',
      nameGap: 30
    },
    // ✨ 2. 配置双 Y 轴以模拟断裂轴效果
    yAxis: [
      { // 左侧 Y 轴 (用于低值)
        type: 'value',
        name: 'Avg. Memory Query',
        nameLocation: 'middle',
        nameGap: 45,
        min: 0,
        max: 60, // 固定最大值以匹配图片
      },
      { // 右侧 Y 轴 (用于高值)
        type: 'value',
        min: 100,
        max: 500,
        splitLine: { show: false }, // 不显示此轴的网格线，保持整洁
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: series
  }
})

watch(chartOptions, (newOptions) => {
  if (myChart) {
    myChart.setOption(newOptions, { notMerge: true })
  }
})

// 用于数据波动的独立、高效的watch
watch(currentChartData, (newData) => {
  if (myChart) {
    const seriesUpdate = allSeriesForUpdate.map(algo => ({
        name: algo,
        data: newData.map((item: { [x: string]: any }) => item[algo] ?? null)
    }));
    
    myChart.setOption({ series: seriesUpdate });
  }
})
</script>


<style scoped>
.controls-container {
  margin: 0 10%;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.controls-container label {
  min-width: 110px;
  margin-right: 8px;
  font-size: 14px;
}
</style>