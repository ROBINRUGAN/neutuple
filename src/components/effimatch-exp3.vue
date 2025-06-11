<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">查询吞吐量</div>
  <div
    ref="chartContainer"
    style="width: 100%; height: 220px"
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
  globalStore.registerRefreshFunction('exp3', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('exp3', () => {
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
    { category: 'acl1', EffiMatch: 13.5, NeuTree: 12.5, NuevoMatch: 0.5 },
    { category: 'acl2', EffiMatch: 11.5, NeuTree: 9.5, NuevoMatch: 0.5 },
    { category: 'acl3', EffiMatch: 12.0, NeuTree: 9.5, NuevoMatch: 0.5 },
    { category: 'acl4', EffiMatch: 11.5, NeuTree: 9.5, NuevoMatch: 1.5 },
    { category: 'acl5', EffiMatch: 10.0, NeuTree: 9.5, NuevoMatch: 1.0 },
    { category: 'fw1', EffiMatch: 9.5, NeuTree: 8.0, NuevoMatch: 1.0 },
    { category: 'fw2', EffiMatch: 14.0, NeuTree: 9.5, NuevoMatch: 1.5 },
    { category: 'fw3', EffiMatch: 9.0, NeuTree: 8.0, NuevoMatch: 0.5 },
    { category: 'fw4', EffiMatch: 9.0, NeuTree: 8.5, NuevoMatch: 1.5 },
    { category: 'fw5', EffiMatch: 12.0, NeuTree: 9.5, NuevoMatch: 1.0 },
    { category: 'ipc1', EffiMatch: 14.0, NeuTree: 12.5, NuevoMatch: 5.5 },
    { category: 'ipc2', EffiMatch: 14.0, NeuTree: 10.5, NuevoMatch: 1.5 }
  ],
  '10k': [
    { category: 'acl1', EffiMatch: 10.0, NeuTree: 6.5, NuevoMatch: 0.5 },
    { category: 'acl2', EffiMatch: 7.0, NeuTree: 5.0, NuevoMatch: 0.5 },
    { category: 'acl3', EffiMatch: 8.0, NeuTree: 3.5, NuevoMatch: 0.5 },
    { category: 'acl4', EffiMatch: 8.5, NeuTree: 5.0, NuevoMatch: 1.0 },
    { category: 'acl5', EffiMatch: 10.0, NeuTree: 7.5, NuevoMatch: 1.0 },
    { category: 'fw1', EffiMatch: 6.5, NeuTree: 5.5, NuevoMatch: 1.0 },
    { category: 'fw2', EffiMatch: 13.0, NeuTree: 8.5, NuevoMatch: 1.5 },
    { category: 'fw3', EffiMatch: 6.5, NeuTree: 6.0, NuevoMatch: 0.5 },
    { category: 'fw4', EffiMatch: 4.5, NeuTree: 3.5, NuevoMatch: 1.0 },
    { category: 'fw5', EffiMatch: 7.5, NeuTree: 7.0, NuevoMatch: 1.5 },
    { category: 'ipc1', EffiMatch: 8.0, NeuTree: 7.5, NuevoMatch: 2.5 },
    { category: 'ipc2', EffiMatch: 10.5, NeuTree: 9.0, NuevoMatch: 1.5 }
  ],
  '100k': [
    { category: 'acl1', EffiMatch: 7.0, NeuTree: 4.5, NuevoMatch: 0.5 },
    { category: 'acl2', EffiMatch: 4.0, NeuTree: 3.0, NuevoMatch: 1.5 },
    { category: 'acl3', EffiMatch: 5.0, NeuTree: 3.5, NuevoMatch: 1.5 },
    { category: 'acl4', EffiMatch: 4.0, NeuTree: 3.5, NuevoMatch: 1.0 },
    { category: 'acl5', EffiMatch: 6.0, NeuTree: 6.0, NuevoMatch: 0.5 },
    { category: 'fw1', EffiMatch: 4.5, NeuTree: 4.0, NuevoMatch: 1.0 },
    { category: 'fw2', EffiMatch: 10.0, NeuTree: 5.5, NuevoMatch: 1.5 },
    { category: 'fw3', EffiMatch: 4.0, NeuTree: 4.0, NuevoMatch: 0.5 },
    { category: 'fw4', EffiMatch: 3.0, NeuTree: 2.5, NuevoMatch: 1.5 },
    { category: 'fw5', EffiMatch: 4.5, NeuTree: 4.5, NuevoMatch: 1.5 },
    { category: 'ipc1', EffiMatch: 4.5, NeuTree: 4.5, NuevoMatch: 1.5 },
    { category: 'ipc2', EffiMatch: 6.5, NeuTree: 6.5, NuevoMatch: 1.5 }
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
        // ['EffiMatch', 'NeuTree', 'NuevoMatch'].forEach((algo) => {
        ;['EffiMatch'].forEach((algo) => {
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
  if (!globalStore.isStarted) {
    return []
  }
  return liveData.value[selectedSize.value]
})

const chartOptions = computed(() => {
  const algorithms = ['EffiMatch', 'NeuTree', 'NuevoMatch']
  const categories = currentChartData.value.map((item: { category: string }) => item.category)

  const series = algorithms.map((algo) => {
    let color, decalPattern
    switch (algo) {
      case 'EffiMatch':
        color = '#73b96e'
        decalPattern = {
          symbol: 'rect',
          rotation: Math.PI / 4,
          color: 'rgba(0, 0, 0, 0.4)',
          symbolSize: 0.6
        }
        break
      case 'NeuTree':
        color = '#f07c79'
        decalPattern = { symbol: 'line', rotation: 0, color: 'rgba(0, 0, 0, 0.4)', symbolSize: 0.8 }
        break
      case 'NuevoMatch':
        color = '#5b8ff9'
        decalPattern = {
          symbol: 'rect',
          rotation: -Math.PI / 4,
          color: 'rgba(0, 0, 0, 0.4)',
          symbolSize: 0.6
        }
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
      itemStyle: { color, decal: decalPattern }
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
      name: 'Mpps',
      nameLocation: 'middle',
      nameGap: 30
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
