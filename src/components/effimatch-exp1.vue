<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">分类延迟分析 (CutTSS)</div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 350px"
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

// 本地状态由全局Store通过回调函数来驱动
const selectedCategory = ref<string>(globalStore.ruleCategory)
let intervalId: number | null = null

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
  // 注册回调函数，用于接收外部指令来更新本地状态
  globalStore.registerRefreshFunction('transexp1', () => {
    selectedCategory.value = globalStore.ruleCategory
  })
  globalStore.registerClearFunction('transexp1', () => {
    // 设置一个无效的 key 来清空图表
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
      name: 'CutTSS w/ TransTuple',
      data: [
        [0, 0.22],
        [20, 0.18],
        [40, 0.25],
        [60, 0.26],
        [80, 0.28],
        [100, 0.29]
      ]
    },
    {
      name: 'CutTSS',
      data: [
        [0, 0.22],
        [20, 0.29],
        [40, 0.42],
        [60, 0.6],
        [80, 0.7],
        [100, 0.82]
      ]
    }
  ],
  fw: [
    {
      name: 'CutTSS w/ TransTuple',
      data: [
        [0, 0.25],
        [20, 0.28],
        [40, 0.3],
        [60, 0.32],
        [80, 0.35],
        [100, 0.38]
      ]
    },
    {
      name: 'CutTSS',
      data: [
        [0, 0.25],
        [20, 0.38],
        [40, 0.5],
        [60, 0.62],
        [80, 0.82],
        [100, 0.88]
      ]
    }
  ],
  ipc: [
    {
      name: 'CutTSS w/ TransTuple',
      data: [
        [0, 0.28],
        [20, 0.3],
        [40, 0.32],
        [60, 0.33],
        [80, 0.35],
        [100, 0.36]
      ]
    },
    {
      name: 'CutTSS',
      data: [
        [0, 0.28],
        [20, 0.35],
        [40, 0.52],
        [60, 0.65],
        [80, 0.78],
        [100, 0.92]
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
  // ✨ 核心修正 1：从本地的 selectedCategory 获取 key
  const categoryKey = selectedCategory.value as keyof typeof liveData.value
  const currentSeries = liveData.value[categoryKey] || []

  const cutTssSeries = currentSeries.find((s: { name: string }) => s.name === 'CutTSS')
  const transTupleSeries = currentSeries.find(
    (s: { name: string }) => s.name === 'CutTSS w/ TransTuple'
  )
  let markPoints: any[] = []
  if (cutTssSeries && transTupleSeries) {
    markPoints = cutTssSeries.data
      .map((point: number[], index: number) => {
        const transTupleY = transTupleSeries.data[index][1]
        const ratio = transTupleY > 1e-6 ? point[1] / transTupleY : 1.0
        return { value: `${ratio.toFixed(1)}X`, coord: point }
      })
      .slice(1)
  }

  const seriesConfig = currentSeries.map((seriesItem: { name: any; data: any }) => {
    let style = {}
    switch (seriesItem.name) {
      case 'CutTSS w/ TransTuple':
        style = { color: '#e62429', lineStyle: { type: 'solid' }, symbol: 'circle', symbolSize: 8 }
        break
      case 'CutTSS':
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
    grid: { top: '2%', left: '8%', right: '4%', bottom: '15%', containLabel: true },
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
      max: 1.0
    },
    series: seriesConfig
  }
}

// --- 5. 监听器 ---

// ✨ 核心修正 2：监听 liveData 和本地的 selectedCategory
watch(
  [liveData, selectedCategory],
  () => {
    if (!myChart || !globalStore.isStarted) {
      // 如果全局是停止状态，可以清空图表
      myChart?.setOption({ series: [] })
      return
    }
    myChart.setOption(getChartOptions(true))
  },
  { deep: true }
)

// 当全局启动状态变化时，也触发一次图表更新
watch(
  () => globalStore.isStarted,
  (isStarted) => {
    if (myChart && isStarted) {
      myChart.setOption(getChartOptions())
    } else if (myChart && !isStarted) {
      // 如果从启动变为停止，也清空图表
      myChart.setOption({ series: [] })
    }
  }
)
</script>

<style scoped>
/* 样式保持不变 */
</style>
