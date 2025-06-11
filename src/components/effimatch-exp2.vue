<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">分类延迟分析 (TabTree)</div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 240px"
    :style="{
      opacity: globalStore.isStarted ? 1 : 0
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

// --- 1. 响应式状态定义 ---

const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
const globalStore = useGlobalStore()

// ✨ 核心修正 1：添加本地状态，由全局回调驱动
const selectedCategory = ref<string>(globalStore.ruleCategory)
let intervalId: number | null = null

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
  // ✨ 核心修正 2：注册回调函数以响应全局指令
  globalStore.registerRefreshFunction('transexp2', () => {
    // 使用新的唯一key
    selectedCategory.value = globalStore.ruleCategory
  })
  globalStore.registerClearFunction('transexp2', () => {
    selectedCategory.value = 'null'
  })

  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value)
    myChart.setOption(getChartOptions())
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

const originalData = {
  acl: [
    {
      name: 'TabTree w/ TransTuple',
      data: [
        [0, 0.43],
        [20, 0.45],
        [40, 0.47],
        [60, 0.48],
        [80, 0.49],
        [100, 0.51]
      ]
    },
    {
      name: 'TabTree',
      data: [
        [0, 0.43],
        [20, 0.52],
        [40, 0.68],
        [60, 0.73],
        [80, 0.85],
        [100, 0.98]
      ]
    }
  ],
  fw: [
    {
      name: 'TabTree w/ TransTuple',
      data: [
        [0, 0.48],
        [20, 0.52],
        [40, 0.55],
        [60, 0.57],
        [80, 0.6],
        [100, 0.62]
      ]
    },
    {
      name: 'TabTree',
      data: [
        [0, 0.48],
        [20, 0.58],
        [40, 0.68],
        [60, 0.75],
        [80, 0.95],
        [100, 1.05]
      ]
    }
  ],
  ipc: [
    {
      name: 'TabTree w/ TransTuple',
      data: [
        [0, 0.68],
        [20, 0.7],
        [40, 0.73],
        [60, 0.75],
        [80, 0.78],
        [100, 0.8]
      ]
    },
    {
      name: 'TabTree',
      data: [
        [0, 0.68],
        [20, 0.75],
        [40, 0.82],
        [60, 0.92],
        [80, 1.05],
        [100, 1.2]
      ]
    }
  ]
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const categoryKey = key as keyof typeof originalData
      liveData.value[categoryKey] = originalData[categoryKey].map((seriesItem) => ({
        ...seriesItem,
        data: seriesItem.data.map((point) => [
          point[0],
          parseFloat((point[1] * (0.95 + Math.random() * 0.1)).toFixed(3))
        ])
      }))
    }
  }, 1000)
}

function stopDataFluctuation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// --- 4. ECharts 配置项生成函数 ---

function getChartOptions(isUpdate = false) {
  // ✨ 核心修正 3：配置生成逻辑依赖本地的 selectedCategory
  const categoryKey = selectedCategory.value as keyof typeof liveData.value
  const currentSeries = liveData.value[categoryKey] || []

  const tabTreeSeries = currentSeries.find((s: { name: string }) => s.name === 'TabTree')
  const transTupleSeries = currentSeries.find(
    (s: { name: string }) => s.name === 'TabTree w/ TransTuple'
  )
  let markPoints: any[] = []
  if (tabTreeSeries && transTupleSeries) {
    markPoints = tabTreeSeries.data
      .map((point: number[], index: string | number) => {
        const transTupleY = transTupleSeries.data[index][1]
        const ratio = transTupleY > 1e-6 ? point[1] / transTupleY : 1.0
        return { value: `${ratio.toFixed(1)}X`, coord: point }
      })
      .slice(1)
  }

  const seriesConfig = currentSeries.map((seriesItem: { name: any; data: any }) => {
    let style = {}
    switch (seriesItem.name) {
      case 'TabTree w/ TransTuple':
        style = { color: '#e62429', lineStyle: { type: 'solid' }, symbol: 'circle', symbolSize: 8 }
        break
      case 'TabTree':
        style = {
          color: '#3366cc',
          lineStyle: { type: 'dashed' },
          symbol: 'rect',
          symbolSize: 8,
          markPoint: {
            symbol: 'rect',
            symbolSize: 8,
            label: { position: 'top', color: '#000', fontSize: 14, fontWeight: 'bold' },
            data: markPoints
          }
        }
        break
    }
    return {
      name: seriesItem.name,
      type: 'line',
      data: seriesItem.data,
      showSymbol: true,
      ...style
    }
  })

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { top: '2%', left: '8%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Compression Ratio',
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    yAxis: {
      type: 'value',
      name: 'Latency (μs)',
      nameLocation: 'middle',
      nameGap: 50,
      min: 0,
      max: 1.3
    },
    series: seriesConfig
  }
}

// --- 5. 监听器 ---

// ✨ 核心修正 4：监听器依赖本地的 selectedCategory
watch(
  [liveData, selectedCategory],
  () => {
    if (!myChart || !globalStore.isStarted) {
      myChart?.setOption({ series: [] })
      return
    }
    myChart.setOption(getChartOptions(true))
  },
  { deep: true }
)

watch(
  () => globalStore.isStarted,
  (isStarted) => {
    if (myChart && isStarted) {
      myChart.setOption(getChartOptions())
    } else if (myChart && !isStarted) {
      myChart.setOption({ series: [] })
    }
  }
)
</script>

<style scoped>
/* 样式保持不变 */
</style>
