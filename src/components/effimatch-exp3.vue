<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">分类延迟分析 (MBitTree)</div>

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

const selectedCategory = ref<string>(globalStore.ruleCategory)
let intervalId: number | null = null

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
  globalStore.registerRefreshFunction('transexp3', () => {
    // 使用新的唯一key
    selectedCategory.value = globalStore.ruleCategory
  })
  globalStore.registerClearFunction('transexp3', () => {
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

// ✨ 1. 数据更新：使用新图表的数据
const originalData = {
  acl: [
    {
      name: 'MBitTree w/ TransTuple',
      data: [
        [0, 0.28],
        [20, 0.3],
        [40, 0.32],
        [60, 0.34],
        [80, 0.36],
        [100, 0.38]
      ]
    },
    {
      name: 'MBitTree',
      data: [
        [0, 0.28],
        [20, 0.31],
        [40, 0.45],
        [60, 0.55],
        [80, 0.61],
        [100, 0.65]
      ]
    }
  ],
  fw: [
    {
      name: 'MBitTree w/ TransTuple',
      data: [
        [0, 0.32],
        [20, 0.33],
        [40, 0.35],
        [60, 0.37],
        [80, 0.39],
        [100, 0.41]
      ]
    },
    {
      name: 'MBitTree',
      data: [
        [0, 0.32],
        [20, 0.4],
        [40, 0.58],
        [60, 0.65],
        [80, 0.78],
        [100, 0.9]
      ]
    }
  ],
  ipc: [
    {
      name: 'MBitTree w/ TransTuple',
      data: [
        [0, 0.52],
        [20, 0.53],
        [40, 0.54],
        [60, 0.55],
        [80, 0.56],
        [100, 0.57]
      ]
    },
    {
      name: 'MBitTree',
      data: [
        [0, 0.52],
        [20, 0.58],
        [40, 0.72],
        [60, 0.82],
        [80, 0.9],
        [100, 1.15]
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
  const categoryKey = selectedCategory.value as keyof typeof liveData.value
  const currentSeries = liveData.value[categoryKey] || []

  // ✨ 2. 动态标注逻辑更新：确保使用正确的系列名称
  const mbitTreeSeries = currentSeries.find((s: { name: string }) => s.name === 'MBitTree')
  const transTupleSeries = currentSeries.find(
    (s: { name: string }) => s.name === 'MBitTree w/ TransTuple'
  )
  let markPoints: any[] = []
  if (mbitTreeSeries && transTupleSeries) {
    markPoints = mbitTreeSeries.data
      .map((point: number[], index: string | number) => {
        const transTupleY = transTupleSeries.data[index][1]
        const ratio = transTupleY > 1e-6 ? point[1] / transTupleY : 1.0
        return { value: `${ratio.toFixed(1)}X`, coord: point }
      })
      .slice(1)
  }

  const seriesConfig = currentSeries.map((seriesItem: { name: any; data: any }) => {
    let style = {}
    // ✨ 3. 系列样式更新：匹配新图表的系列名称和样式
    switch (seriesItem.name) {
      case 'MBitTree w/ TransTuple':
        style = { color: '#e62429', lineStyle: { type: 'solid' }, symbol: 'circle', symbolSize: 8 }
        break
      case 'MBitTree':
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

  if (isUpdate) {
    return { series: seriesConfig }
  }

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { top: '5%', left: '8%', right: '4%', bottom: '20%', containLabel: true },
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
      // ✨ 4. Y轴范围调整
      max: 1.4
    },
    series: seriesConfig
  }
}

// --- 5. 监听器 ---

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
