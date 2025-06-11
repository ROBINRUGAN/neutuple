<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">内存使用情况</div>
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
  globalStore.registerRefreshFunction('exp4', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('exp4', () => {
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
    { category: 'NCF', withoutIndexSharing: 4, indexSharing: 1.6 },
    { category: 'LSTM', withoutIndexSharing: 10, indexSharing: 2.4 },
    { category: 'VGG16', withoutIndexSharing: 56, indexSharing: 32.0 },
    { category: 'VGG19', withoutIndexSharing: 64, indexSharing: 32.0 },
    { category: 'BERT-base', withoutIndexSharing: 154, indexSharing: 32.0 }
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
        // Updated the key to fluctuate to match new data structure
        ;['withoutIndexSharing'].forEach((algo) => {
          const originalValue = item[algo as keyof typeof item] as number
          const multiplier = 0.9 + Math.random() * 0.2
          newItem[algo as keyof typeof item] = parseFloat((originalValue * multiplier).toFixed(2))
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
  if (!globalStore.isStarted || !liveData.value['1k']) {
    return []
  }
  return liveData.value['1k']
})

const chartOptions = computed(() => {
  // Updated algorithm names and data keys
  const algorithms = ['Without Index Sharing', 'Index Sharing']
  const dataKeys = ['withoutIndexSharing', 'indexSharing']
  const colors = ['#9d6ac2', '#a9c0e2'] // Purple and Light Blue from the image

  const categories = currentChartData.value.map((item: { category: string }) => item.category)

  const series = algorithms.map((algo, index) => {
    const dataKey = dataKeys[index]
    const color = colors[index]

    return {
      name: algo,
      type: 'bar',
      barGap: '0%', // Bars for the same category are next to each other
      emphasis: { focus: 'series' },
      data: currentChartData.value.map(
        (item: { [x: string]: any }) => item[dataKey as keyof typeof item]
      ),
      // Updated itemStyle to use solid colors and remove decal
      itemStyle: { color },
      // Adding data labels on top of the bars
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        color: '#333',
        fontSize: 10
      }
    }
  })

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { top: '5%', left: '7%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: categories },
    yAxis: {
      type: 'value',
      name: 'Memory Usage (MB)', // Updated Y-axis title
      nameLocation: 'middle',
      nameGap: 40,
      max: 180 // Adjust max value to give space for the highest bar's label
    },
    series: series
  }
})

watch(
  () => currentChartData.value,
  (newData) => {
    if (myChart && newData.length > 0) {
      myChart.setOption(chartOptions.value, true)
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
