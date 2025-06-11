<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">各包分类器的内存开销</div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 320px"
    :style="{ opacity: globalStore.isStarted ? 1 : 0 }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

const globalStore = useGlobalStore()
const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null

const selectedSize = ref<string>(globalStore.ruleScale)
let intervalId: number | null = null

onMounted(() => {
  globalStore.registerRefreshFunction('exp1', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('exp1', () => {
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

const originalData = {
  '1k': [
    {
      category: 'ACL',
      EffiMatch: 16.8,
      NeuTree: 15.9,
      NuevoMatch: 23.1,
      TabTree: 43.9,
      KickTree: 37.2,
      PSTSS: 47.6,
      CutSplit: 25.8
    },
    {
      category: 'FW',
      EffiMatch: 18.9,
      NeuTree: 13.5,
      NuevoMatch: 25.2,
      TabTree: 44.8,
      KickTree: 34.1,
      PSTSS: 47.3,
      CutSplit: 23.9
    },
    {
      category: 'IPC',
      EffiMatch: 15.3,
      NeuTree: 12.1,
      NuevoMatch: 14.2,
      TabTree: 47.5,
      KickTree: 24.3,
      PSTSS: 48.1,
      CutSplit: 27.1
    }
  ],
  '10k': [
    {
      category: 'ACL',
      EffiMatch: 17.5,
      NeuTree: 18.2,
      NuevoMatch: 25.1,
      TabTree: 44.3,
      KickTree: 39.8,
      PSTSS: 47.8,
      CutSplit: 29.7
    },
    {
      category: 'FW',
      EffiMatch: 13.2,
      NeuTree: 12.8,
      NuevoMatch: 22.9,
      TabTree: 33.6,
      KickTree: 26.4,
      PSTSS: 47.1,
      CutSplit: 24.2
    },
    {
      category: 'IPC',
      EffiMatch: 14.9,
      NeuTree: 9.3,
      NuevoMatch: 18.5,
      TabTree: 30.9,
      KickTree: 23.7,
      PSTSS: 48.3,
      CutSplit: 21.5
    }
  ],
  '100k': [
    {
      category: 'ACL',
      EffiMatch: 12.7,
      NeuTree: 16.5,
      NuevoMatch: 24.6,
      TabTree: 33.1,
      KickTree: 27.6,
      PSTSS: 47.5,
      CutSplit: 24.8
    },
    {
      category: 'FW',
      EffiMatch: 13.9,
      NeuTree: 15.2,
      NuevoMatch: 21.8,
      TabTree: 23.9,
      KickTree: 28.5,
      PSTSS: 47.9,
      CutSplit: 26.3
    },
    {
      category: 'IPC',
      EffiMatch: 12.1,
      NeuTree: 11.5,
      NuevoMatch: 11.8,
      TabTree: 22.5,
      KickTree: 27.9,
      PSTSS: 45.6,
      CutSplit: 20.8
    }
  ]
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

const algorithms = [
  'EffiMatch',
  'NeuTree',
  'NuevoMatch',
  'TabTree',
  'KickTree',
  'PSTSS',
  'CutSplit'
]

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const sizeKey = key as keyof typeof originalData
      liveData.value[sizeKey] = originalData[sizeKey].map((item) => {
        const newItem = { ...item } as { [key: string]: any }
        ;['EffiMatch'].forEach((algo) => {
          const originalValue = item[algo as keyof typeof item] as number
          const multiplier = 0.8 + Math.random() * 0.4
          newItem[algo] = parseFloat((originalValue * multiplier).toFixed(2))
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
  if (!globalStore.isStarted) {
    return []
  }
  return liveData.value[selectedSize.value]
})

const chartOptions = computed(() => {
  const categories = currentChartData.value.map((item: { category: string }) => item.category)

  const seriesData = algorithms.map((algo) => ({
    name: algo,
    type: 'bar',
    barGap: 0,
    emphasis: { focus: 'series' },
    data: currentChartData.value.map(
      (item: { [x: string]: number }) => item[algo as keyof typeof item]
    )
  }))

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: algorithms, textStyle: { fontSize: 12 }, top: 'bottom' },
    grid: { left: '10%', right: '4%', bottom: '20%', top: '5%', containLabel: true },
    xAxis: [
      {
        type: 'category',
        data: categories,
        axisLabel: { interval: 0, rotate: 0 }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Byte / Rule',
        nameLocation: 'middle',
        nameGap: 45
      }
    ],
    series: seriesData
  }
})

watch(chartOptions, (newOptions, oldOptions) => {
  if (myChart && JSON.stringify(newOptions.series) !== JSON.stringify(oldOptions?.series)) {
    myChart.setOption(newOptions, true)
  }
})
</script>

<style scoped></style>
