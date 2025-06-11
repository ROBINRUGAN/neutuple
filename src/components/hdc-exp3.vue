<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">内存消耗</div>
  <div
    ref="chartContainer"
    style="width: 100%; height: 300px"
    :style="{
      opacity: globalStore.isStarted ? 1 : 0
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
const globalStore = useGlobalStore()

const selectedSize = ref<string>(globalStore.ruleScale)

let intervalId: number | null = null

onMounted(() => {
  // The user prompt indicates this is for exp4, but the old code has exp3.
  // I will assume the experiment name should also be updated.
  globalStore.registerRefreshFunction('neuexp3', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('neuexp3', () => {
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

// Data extracted from the provided image
const originalData = {
  '1k': [
    { category: 'ACL 1k', NeuTree: 17, NuevoMatch: 19, TabTree: 44, KickTree: 42, PSTSS: 47, CutSplit: 26 },
    { category: 'FW 1k', NeuTree: 16, NuevoMatch: 22, TabTree: 45, KickTree: 42, PSTSS: 47, CutSplit: 21 },
    { category: 'IPC 1k', NeuTree: 13, NuevoMatch: 25, TabTree: 47, KickTree: 43, PSTSS: 47, CutSplit: 18 }
  ],
  '10k': [
    { category: 'ACL 10k', NeuTree: 14, NuevoMatch: 25, TabTree: 40, KickTree: 34, PSTSS: 47, CutSplit: 29 },
    { category: 'FW 10k', NeuTree: 12, NuevoMatch: 10, TabTree: 24, KickTree: 44, PSTSS: 47, CutSplit: 20 },
    { category: 'IPC 10k', NeuTree: 8, NuevoMatch: 6, TabTree: 39, KickTree: 36, PSTSS: 47, CutSplit: 19 }
  ],
  '100k': [
    { category: 'ACL 100k', NeuTree: 8, NuevoMatch: 5, TabTree: 24, KickTree: 28, PSTSS: 47, CutSplit: 20 },
    { category: 'FW 100k', NeuTree: 15, NuevoMatch: 4, TabTree: 25, KickTree: 28, PSTSS: 47, CutSplit: 19 },
    { category: 'IPC 100k', NeuTree: 11, NuevoMatch: 2, TabTree: 23, KickTree: 27, PSTSS: 47, CutSplit: 18 }
  ]
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const sizeKey = key as keyof typeof originalData
      liveData.value[sizeKey] = originalData[sizeKey].map((item) => {
        const newItem = { ...item } as { [key: string]: number | string }
        ;['NeuTree', 'NuevoMatch', 'TabTree', 'KickTree', 'PSTSS', 'CutSplit'].forEach((algo) => {
          const originalValue = item[algo as keyof typeof item] as number
          // Keep PSTSS stable as it appears to be a fixed upper bound in the chart
          if (algo === 'PSTSS') {
            newItem[algo as keyof typeof item] = originalValue
          } else {
            const multiplier = 0.95 + Math.random() * 0.1 // Apply a small fluctuation
            newItem[algo as keyof typeof item] = parseFloat((originalValue * multiplier).toFixed(2))
          }
        })
        return newItem
      })
    }
  }, 1000)
}

function stopDataFluctuation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const currentChartData = computed(() => {
  if (!globalStore.isStarted || !selectedSize.value || !liveData.value[selectedSize.value]) {
    return []
  }
  return liveData.value[selectedSize.value]
})

const chartOptions = computed(() => {
  const algorithms = ['NeuTree', 'NuevoMatch', 'TabTree', 'KickTree', 'PSTSS', 'CutSplit']
  const categories = currentChartData.value.map((item: { category: string }) => item.category)

  const series = algorithms.map((algo) => {
    let color: string
    let decalPattern: echarts.PatternObject | undefined

    switch (algo) {
      case 'NeuTree':
        color = '#e53935' // Solid Red
        decalPattern = undefined
        break
      case 'NuevoMatch':
        color = '#f4a9a8' // Light Red
        decalPattern = {
          symbol: 'line',
          rotation: Math.PI / 4,
          color: 'rgba(0, 0, 0, 0.3)'
        }
        break
      case 'TabTree':
        color = '#00897b' // Solid Teal
        decalPattern = undefined
        break
      case 'KickTree':
        color = '#1e88e5' // Dark Blue
        decalPattern = {
          symbol: 'line',
          rotation: 0, // Horizontal lines
          color: 'rgba(0, 0, 0, 0.4)'
        }
        break
      case 'PSTSS':
        color = '#4dd0e1' // Light Cyan
        decalPattern = {
          symbol: 'path://M0,0 L1,1 M1,0 L0,1', // 'X' shape
          color: 'rgba(0, 0, 0, 0.4)',
          symbolSize: 0.6
        }
        break
      case 'CutSplit':
        color = '#2dbba7' // Green/Teal
        decalPattern = {
          symbol: 'line',
          rotation: -Math.PI / 4,
          color: 'rgba(0, 0, 0, 0.4)'
        }
        break
      default:
        color = '#ccc'
        decalPattern = undefined
        break
    }

    return {
      name: algo,
      type: 'bar',
      barGap: 0,
      emphasis: { focus: 'series' },
      data: currentChartData.value.map(
        (item: { [x: string]: any }) => item[algo as keyof typeof item]
      ),
      itemStyle: {
        color: color,
        decal: decalPattern
      }
    }
  })

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { top: '5%', left: '8%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        interval: 0 // Show all labels
      }
    },
    yAxis: {
      type: 'value',
      name: 'Byte / Rule',
      nameLocation: 'middle',
      nameGap: 45,
      max: 50,
      interval: 15 // Set Y-axis ticks to match the image grid
    },
    series: series
  }
})

watch(chartOptions, (newOptions, oldOptions) => {
  if (myChart && JSON.stringify(newOptions.series) !== JSON.stringify(oldOptions?.series)) {
    myChart.setOption(newOptions, true)
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