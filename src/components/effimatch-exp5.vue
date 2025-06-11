<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">规则访问效率</div>
  <div
    ref="chartContainer"
    style="width: 100%; height: 330px"
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
  globalStore.registerRefreshFunction('exp5', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('exp5', () => {
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
    { category: 'acl1', EffiMatch: 1.3, NeuTree: 1.6, NuevoMatch: 1.3 },
    { category: 'acl2', EffiMatch: 1.4, NeuTree: 1.8, NuevoMatch: 1.5 },
    { category: 'acl3', EffiMatch: 1.6, NeuTree: 2.1, NuevoMatch: 1.7 },
    { category: 'acl4', EffiMatch: 1.5, NeuTree: 2.0, NuevoMatch: 1.6 },
    { category: 'acl5', EffiMatch: 1.4, NeuTree: 1.9, NuevoMatch: 1.6 },
    { category: 'fw1', EffiMatch: 1.3, NeuTree: 1.8, NuevoMatch: 1.3 },
    { category: 'fw2', EffiMatch: 1.1, NeuTree: 1.4, NuevoMatch: 1.1 },
    { category: 'fw3', EffiMatch: 1.2, NeuTree: 1.6, NuevoMatch: 1.2 },
    { category: 'fw4', EffiMatch: 1.7, NeuTree: 2.0, NuevoMatch: 1.6 },
    { category: 'fw5', EffiMatch: 1.5, NeuTree: 1.8, NuevoMatch: 1.5 },
    { category: 'ipc1', EffiMatch: 1.3, NeuTree: 1.6, NuevoMatch: 1.3 },
    { category: 'ipc2', EffiMatch: 1.1, NeuTree: 1.4, NuevoMatch: 1.2 }
  ],
  '10k': [
    { category: 'acl1', EffiMatch: 1.5, NeuTree: 1.8, NuevoMatch: 1.4 },
    { category: 'acl2', EffiMatch: 1.7, NeuTree: 2.1, NuevoMatch: 1.6 },
    { category: 'acl3', EffiMatch: 2.0, NeuTree: 2.4, NuevoMatch: 1.9 },
    { category: 'acl4', EffiMatch: 1.9, NeuTree: 2.2, NuevoMatch: 1.7 },
    { category: 'acl5', EffiMatch: 1.7, NeuTree: 2.0, NuevoMatch: 1.6 },
    { category: 'fw1', EffiMatch: 1.5, NeuTree: 2.0, NuevoMatch: 1.4 },
    { category: 'fw2', EffiMatch: 1.3, NeuTree: 1.7, NuevoMatch: 1.2 },
    { category: 'fw3', EffiMatch: 1.5, NeuTree: 1.9, NuevoMatch: 1.3 },
    { category: 'fw4', EffiMatch: 2.1, NeuTree: 2.5, NuevoMatch: 2.0 },
    { category: 'fw5', EffiMatch: 1.9, NeuTree: 2.1, NuevoMatch: 1.7 },
    { category: 'ipc1', EffiMatch: 1.8, NeuTree: 2.0, NuevoMatch: 1.6 },
    { category: 'ipc2', EffiMatch: 1.5, NeuTree: 1.8, NuevoMatch: 1.4 }
  ],
  '100k': [
    { category: 'acl1', EffiMatch: 1.7, NeuTree: 1.9, NuevoMatch: 1.6 },
    { category: 'acl2', EffiMatch: 1.9, NeuTree: 2.2, NuevoMatch: 1.8 },
    { category: 'acl3', EffiMatch: 2.1, NeuTree: 2.4, NuevoMatch: 2.0 },
    { category: 'acl4', EffiMatch: 2.0, NeuTree: 2.2, NuevoMatch: 1.8 },
    { category: 'acl5', EffiMatch: 1.9, NeuTree: 2.1, NuevoMatch: 1.7 },
    { category: 'fw1', EffiMatch: 1.7, NeuTree: 2.1, NuevoMatch: 1.6 },
    { category: 'fw2', EffiMatch: 1.5, NeuTree: 1.9, NuevoMatch: 1.4 },
    { category: 'fw3', EffiMatch: 1.6, NeuTree: 2.0, NuevoMatch: 1.5 },
    { category: 'fw4', EffiMatch: 2.2, NeuTree: 2.6, NuevoMatch: 2.1 },
    { category: 'fw5', EffiMatch: 2.0, NeuTree: 2.3, NuevoMatch: 1.9 },
    { category: 'ipc1', EffiMatch: 2.0, NeuTree: 2.2, NuevoMatch: 1.8 },
    { category: 'ipc2', EffiMatch: 1.8, NeuTree: 2.0, NuevoMatch: 1.6 }
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
      name: 'Rule Acc. / Packet',
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
