<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">构造时间</div>
  <div
    ref="chartContainer"
    style="width: 100%; height: 400px"
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

// This ref will be updated by the globalStore callback
const selectedSize = ref<string>(globalStore.ruleScale)

let intervalId: number | null = null

onMounted(() => {
  // The 'exp5' here is just a key for the store, can be different from the figure number
  globalStore.registerRefreshFunction('neuexp4', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('neuexp4', () => {
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

// Data extracted from the provided image for all three subplots
const originalData = {
  '1k': {
    categories: ['acl1', 'acl2', 'acl3', 'acl4', 'acl5', 'fw1', 'fw2', 'fw3', 'fw4', 'fw5', 'ipc1', 'ipc2'],
    neuTree: [0.004, 0.005, 0.005, 0.006, 0.004, 0.008, 0.015, 0.01, 0.004, 0.005, 0.015, 0.005],
    nuevoMatch: [80, 90, 80, 85, 70, 20, 50, 40, 40, 55, 80, 150]
  },
  '10k': {
    categories: ['acl1', 'acl2', 'acl3', 'acl4', 'acl5', 'fw1', 'fw2', 'fw3', 'fw4', 'fw5', 'ipc1', 'ipc2'],
    neuTree: [0.2, 0.3, 0.2, 0.2, 0.05, 0.2, 0.25, 0.2, 0.15, 0.1, 0.2, 0.25],
    nuevoMatch: [90, 110, 100, 110, 120, 100, 110, 100, 90, 120, 180, 280]
  },
  '100k': {
    categories: ['acl1', 'acl2', 'acl3', 'acl4', 'acl5', 'fw1', 'fw2', 'fw3', 'fw4', 'fw5', 'ipc1', 'ipc2'],
    neuTree: [25, 30, 28, 35, 25, 8, 12, 4, 5, 3, 20, 15],
    nuevoMatch: [350, 400, 1100, 800, 700, 900, 1000, 800, 800, 750, 800, 700]
  }
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const sizeKey = key as keyof typeof originalData
      const originalDataset = originalData[sizeKey]
      const liveDataset = liveData.value[sizeKey]

      ;['neuTree', 'nuevoMatch'].forEach((algoKey) => {
        const dataKey = algoKey as 'neuTree' | 'nuevoMatch'
        liveDataset[dataKey] = originalDataset[dataKey].map((val) => {
          const multiplier = 0.98 + Math.random() * 0.04 // Smaller fluctuation
          return parseFloat((val * multiplier).toFixed(3))
        })
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
  const scale = selectedSize.value as keyof typeof liveData.value
  if (!globalStore.isStarted || !scale || !liveData.value[scale]) {
    return { categories: [], neuTree: [], nuevoMatch: [] }
  }
  return liveData.value[scale]
})

const chartOptions = computed(() => {
  return {
    animation: true,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['NeuTree', 'NuevoMatch'],
      bottom: 0, // Position legend at the top
      textStyle: { fontSize: 14 }
    },
    grid: { top: '3%', left: '3%', right: '4%', bottom: '7%', containLabel: true },
    xAxis: {
      type: 'category',
      data: currentChartData.value.categories
    },
    yAxis: {
      type: 'log', // Use logarithmic scale
      name: 'Constr. Time (s)',
      nameLocation: 'middle',
      nameGap: 55,
      min: 0.001,
      max: 2000 // Set a max value to accommodate all scales
    },
    series: [
      {
        name: 'NeuTree',
        type: 'bar',
        barGap: '0%', // Group bars together
        emphasis: { focus: 'series' },
        data: currentChartData.value.neuTree,
        itemStyle: {
          color: '#86d5d5' // Light teal color from image
        }
      },
      {
        name: 'NuevoMatch',
        type: 'bar',
        barGap: '0%',
        emphasis: { focus: 'series' },
        data: currentChartData.value.nuevoMatch,
        itemStyle: {
          color: '#337ab7', // Darker blue color from image
          // Add decal for the hatched pattern
          decal: {
            symbol: 'path://M 0,10 L 10,0 M -1,1 L 1,-1 M 9,11 L 11,9',
            symbolSize: 0.8,
            color: 'rgba(255, 255, 255, 0.6)',
            dashArrayX: [1, 0],
            dashArrayY: [2, 5]
          }
        }
      }
    ]
  }
})

watch(
  () => currentChartData.value,
  (newData) => {
    if (myChart && newData.categories.length > 0) {
      myChart.setOption(chartOptions.value, false) // Use false for non-merging update to handle category changes
    }
  },
  { deep: true }
)
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
