<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">恢复率分析</div>

  <div
    ref="chartContainer"
    :style="{
      opacity: globalStore.isStarted ? 1 : 0
    }"
    style="width: 100%; height: 320px"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

// --- 1. 响应式状态定义 ---

const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
let intervalId: number | null = null
const globalStore = useGlobalStore()
const originalData = ref<[number, number][]>([
  [0, 0],
  [0.05, 2.5],
  [0.1, 5],
  [0.15, 8.5],
  [0.2, 12],
  [0.25, 15],
  [0.3, 18],
  [0.35, 20.5],
  [0.4, 23],
  [0.45, 25.5],
  [0.5, 28],
  [0.53, 33],
  [0.55, 38],
  [0.58, 44],
  [0.6, 50],
  [0.63, 55],
  [0.65, 60],
  [0.68, 67.5],
  [0.7, 75],
  [0.75, 80],
  [0.8, 85],
  [0.85, 88.5],
  [0.9, 91.333],
  [0.95, 95.66],
  [1, 100]
])

const liveData = ref<[number, number][]>(JSON.parse(JSON.stringify(originalData.value)))

const initialTargetY = originalData.value.find((p) => p[0] === 0.9)?.[1] || 91.333
const targetYValue = ref(initialTargetY)

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value)
    // ✨ 注意：这里不再需要 setOption，因为 watch 会立即执行一次
    // myChart.setOption(chartOptions.value)
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

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    const newPoints: [number, number][] = []
    if (originalData.value.length === 0) {
      liveData.value = []
      return
    }

    const firstPoint = originalData.value[0]
    const firstMultiplier = 0.9 + Math.random() * 0.2
    const newFirstY = Math.min(100, firstPoint[1] * firstMultiplier)
    newPoints.push([firstPoint[0], parseFloat(newFirstY.toFixed(3))])

    for (let i = 1; i < originalData.value.length; i++) {
      const prevOriginalPoint = originalData.value[i - 1]
      const currentOriginalPoint = originalData.value[i]
      const prevNewY = newPoints[i - 1][1]
      const originalIncrement = currentOriginalPoint[1] - prevOriginalPoint[1]
      const incrementMultiplier = 0.9 + Math.random() * 0.2
      const newIncrement = originalIncrement * incrementMultiplier
      let newCurrentY = prevNewY + newIncrement
      newCurrentY = Math.min(100, Math.max(prevNewY, newCurrentY))
      newPoints.push([currentOriginalPoint[0], parseFloat(newCurrentY.toFixed(3))])
    }

    liveData.value = newPoints
    const newTargetPoint = newPoints.find((p) => p[0] === 0.9)
    if (newTargetPoint) {
      targetYValue.value = newTargetPoint[1]
    }
  }, 1000)
}

function stopDataFluctuation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const chartOptions = computed(() => {
  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0]
        return `
          压缩率: ${point.axisValue.toFixed(3)}<br/>
          恢复率: ${point.data[1].toFixed(3)}%
        `
      }
    },
    grid: { left: '15%', right: '5%', bottom: '25%', top: '5%', containLabel: false },
    xAxis: {
      type: 'value',
      name: 'Compression Ratio',
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 1
    },
    yAxis: {
      type: 'value',
      name: 'Recovery Rate(%)',
      nameLocation: 'middle',
      nameGap: 50,
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        type: 'line',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(180, 140, 220, 0.6)' },
            { offset: 1, color: 'rgba(180, 140, 220, 0.1)' }
          ])
        },
        lineStyle: { color: 'rgba(180, 140, 220, 1)', width: 2 },
        itemStyle: { color: 'rgba(180, 140, 220, 1)' },
        smooth: true,
        showSymbol: false,
        data: liveData.value,
        markLine: {
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#333' },
          label: { position: 'insideEndTop', formatter: '{b}' },
          emphasis: { disabled: true },
          data: [
            {
              yAxis: targetYValue.value,
              name: `${targetYValue.value.toFixed(3)}%`,
              label: { position: 'insideStartTop' }
            },
            { xAxis: 0.9, name: '0.9' }
          ]
        }
      }
    ]
  }
})

watch(
  chartOptions,
  (newOptions) => {
    if (myChart) {
      myChart.setOption(newOptions)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* You can add styles here if needed */
</style>
