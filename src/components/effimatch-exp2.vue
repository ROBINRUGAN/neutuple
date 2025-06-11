<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">LPC方法构造时间</div>

  <!-- <div class="controls-container">
    <label for="rules-select">选择规则集规模: </label>

    <el-select id="rules-select" v-model="selectedSize">
      <el-option value="1k" label="1k rules"></el-option>
      <el-option value="10k" label="10k rules"></el-option>
      <el-option value="100k" label="100k rules"></el-option>
    </el-select>
  </div> -->
  <div
    ref="chartContainer"
    style="width: 100%; height: 220px"
    :style="{ opacity: globalStore.isStarted ? 1 : 0 }"
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
    { category: 'acl1', EffiMatch: 0.002, NeuTree: 0.003, NuevoMatch: 50 },
    { category: 'acl2', EffiMatch: 0.002, NeuTree: 0.004, NuevoMatch: 60 },
    { category: 'acl3', EffiMatch: 0.002, NeuTree: 0.005, NuevoMatch: 70 },
    { category: 'acl4', EffiMatch: 0.002, NeuTree: 0.004, NuevoMatch: 60 },
    { category: 'acl5', EffiMatch: 0.002, NeuTree: 0.005, NuevoMatch: 30 },
    { category: 'fw1', EffiMatch: 0.002, NeuTree: 0.008, NuevoMatch: 40 },
    { category: 'fw2', EffiMatch: 0.002, NeuTree: 0.009, NuevoMatch: 50 },
    { category: 'fw3', EffiMatch: 0.002, NeuTree: 0.006, NuevoMatch: 30 },
    { category: 'fw4', EffiMatch: 0.002, NeuTree: 0.007, NuevoMatch: 20 },
    { category: 'fw5', EffiMatch: 0.002, NeuTree: 0.008, NuevoMatch: 30 },
    { category: 'ipc1', EffiMatch: 0.002, NeuTree: 0.004, NuevoMatch: 40 },
    { category: 'ipc2', EffiMatch: 0.002, NeuTree: 0.005, NuevoMatch: 70 }
  ],
  '10k': [
    { category: 'acl1', EffiMatch: 0.03, NeuTree: 0.4, NuevoMatch: 100 },
    { category: 'acl2', EffiMatch: 0.03, NeuTree: 0.5, NuevoMatch: 120 },
    { category: 'acl3', EffiMatch: 0.03, NeuTree: 0.6, NuevoMatch: 150 },
    { category: 'acl4', EffiMatch: 0.03, NeuTree: 0.5, NuevoMatch: 120 },
    { category: 'acl5', EffiMatch: 0.03, NeuTree: 0.6, NuevoMatch: 80 },
    { category: 'fw1', EffiMatch: 0.03, NeuTree: 0.8, NuevoMatch: 100 },
    { category: 'fw2', EffiMatch: 0.03, NeuTree: 0.9, NuevoMatch: 120 },
    { category: 'fw3', EffiMatch: 0.03, NeuTree: 0.7, NuevoMatch: 80 },
    { category: 'fw4', EffiMatch: 0.03, NeuTree: 0.8, NuevoMatch: 60 },
    { category: 'fw5', EffiMatch: 0.03, NeuTree: 0.9, NuevoMatch: 80 },
    { category: 'ipc1', EffiMatch: 0.03, NeuTree: 0.5, NuevoMatch: 100 },
    { category: 'ipc2', EffiMatch: 0.03, NeuTree: 0.6, NuevoMatch: 250 }
  ],
  '100k': [
    { category: 'acl1', EffiMatch: 15, NeuTree: 30, NuevoMatch: 400 },
    { category: 'acl2', EffiMatch: 12, NeuTree: 40, NuevoMatch: 500 },
    { category: 'acl3', EffiMatch: 13, NeuTree: 50, NuevoMatch: 1100 },
    { category: 'acl4', EffiMatch: 12, NeuTree: 40, NuevoMatch: 600 },
    { category: 'acl5', EffiMatch: 13, NeuTree: 45, NuevoMatch: 700 },
    { category: 'fw1', EffiMatch: 15, NeuTree: 60, NuevoMatch: 800 },
    { category: 'fw2', EffiMatch: 18, NeuTree: 70, NuevoMatch: 900 },
    { category: 'fw3', EffiMatch: 12, NeuTree: 50, NuevoMatch: 600 },
    { category: 'fw4', EffiMatch: 11, NeuTree: 55, NuevoMatch: 500 },
    { category: 'fw5', EffiMatch: 12, NeuTree: 60, NuevoMatch: 700 },
    { category: 'ipc1', EffiMatch: 15, NeuTree: 40, NuevoMatch: 800 },
    { category: 'ipc2', EffiMatch: 18, NeuTree: 50, NuevoMatch: 900 }
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
        ;['EffiMatch'].forEach((algo) => {
          const originalValue = item[algo as keyof typeof item] as number
          const multiplier = 0.6 + Math.random() * 0.7
          const floatedValue = originalValue * multiplier
          newItem[algo as keyof typeof item] =
            floatedValue < 1
              ? parseFloat(floatedValue.toPrecision(2))
              : parseFloat(floatedValue.toFixed(2))
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
    legend: { textStyle: { fontSize: 12 }, top: 'bottom' },
    grid: { top: '5%', left: '7%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: categories },
    yAxis: {
      type: 'log',
      name: 'Constr. Time (s)',
      nameLocation: 'middle',
      nameGap: 45,
      axisLabel: {
        formatter: (value: number) => {
          if (value === 0) return 0
          if (value < 1) return value.toExponential(0) // 1e-3, 1e-2, etc.
          return value
        }
      }
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
