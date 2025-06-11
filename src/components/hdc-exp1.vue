<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">
    规则爆炸率
  </div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 320px"
    :style="{
      opacity: globalStore.isStarted ? 1 : 0
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

// --- 1. 响应式状态定义 ---

const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
const globalStore = useGlobalStore()

// 本地状态由全局Store驱动
const selectedSize = ref<string>(globalStore.ruleScale)
let intervalId: number | null = null

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
  // ✨ 向全局Store注册回调，标识符可以保持不变或更新
  globalStore.registerRefreshFunction('neuexp1', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('neuexp1', () => {
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

// --- 3. 图表数据 ---

// ✨ 更新为新图表的数据
const originalData = {
  '1k': [
    { category: 8, ACL: 36, FW: 28, IPC: 7 },
    { category: 10, ACL: 32, FW: 27, IPC: 6.5 },
    { category: 12, ACL: 29, FW: 33, IPC: 6.5 },
    { category: 14, ACL: 21, FW: 30, IPC: 6 },
    { category: 16, ACL: 20.5, FW: 25, IPC: 5.5 },
    { category: 18, ACL: 18, FW: 20, IPC: 5 }
  ],
  '10k': [
    { category: 8, ACL: 32, FW: 6, IPC: 22 },
    { category: 10, ACL: 28, FW: 6, IPC: 21 },
    { category: 12, ACL: 24, FW: 6, IPC: 20.5 },
    { category: 14, ACL: 21, FW: 6, IPC: 20 },
    { category: 16, ACL: 19, FW: 5.8, IPC: 19 },
    { category: 18, ACL: 17, FW: 5.8, IPC: 18 }
  ],
  '100k': [
    { category: 8, ACL: 14.5, FW: 2.5, IPC: 4.2 },
    { category: 10, ACL: 14.5, FW: 2, IPC: 4 },
    { category: 12, ACL: 14, FW: 1.8, IPC: 3.5 },
    { category: 14, ACL: 7, FW: 1.5, IPC: 2.5 },
    { category: 16, ACL: 4, FW: 1.2, IPC: 2.2 },
    { category: 18, ACL: 4, FW: 1.2, IPC: 2.2 }
  ]
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

// ✨ 更新为新的算法列表
const algorithms = ['ACL', 'FW', 'IPC']

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const sizeKey = key as keyof typeof originalData
      liveData.value[sizeKey] = originalData[sizeKey].map((item) => {
        const newItem = { ...item } as { [key: string]: any }
        algorithms.forEach((algo) => {
          const originalValue = item[algo as keyof typeof item] as number
          // Fluctuate data by up to +/- 5% to keep it visually stable
          const multiplier = 0.975 + Math.random() * 0.05
          newItem[algo] = parseFloat((originalValue * multiplier).toFixed(2))
        })
        return newItem
      })
    }
  }, 800) // Slightly slower fluctuation
}

function stopDataFluctuation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const currentChartData = computed(() => {
  if (!globalStore.isStarted || !liveData.value[selectedSize.value]) {
    // Return empty structure to avoid errors before selection
    return []
  }
  return liveData.value[selectedSize.value]
})

// --- 4. ECharts 配置项 ---

const chartOptions = computed(() => {
  const categories = currentChartData.value.map((item: { category: string }) => item.category)

  const series = algorithms.map((algo) => {
    let color, symbol, lineStyle
    // ✨ 更新系列样式以匹配原图
    switch (algo) {
      case 'ACL':
        color = '#008b8b' // Teal color
        symbol = 'star'
        lineStyle = { type: 'dashed' }
        break
      case 'FW':
        color = '#696969' // Gray color
        symbol = 'circle'
        lineStyle = { type: 'dashdot' }
        break
      case 'IPC':
        color = '#9ACD32' // Lime green color
        symbol = 'circle'
        lineStyle = { type: 'solid' }
        break
    }

    return {
      name: algo,
      type: 'line',
      symbol: symbol,
      symbolSize: 8,
      lineStyle: lineStyle,
      itemStyle: { color },
      data: currentChartData.value.map(
        (item: { [x: string]: any }) => item[algo as keyof typeof item]
      )
    }
  })

  // ✨ 动态Y轴范围
  let yAxisMax = 35
  if (selectedSize.value === '1k') yAxisMax = 40
  if (selectedSize.value === '100k') yAxisMax = 16

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 12 },
      // ✨ 让图例也显示标记点形状
      data: algorithms.map((algo) => ({
        name: algo,
        icon: series.find((s) => s.name === algo)?.symbol || 'circle'
      }))
    },
    grid: { top: '5%', left: '7%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      // ✨ 动态X轴标签
      name: `Bucket Size (${selectedSize.value})`,
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      // ✨ 更新Y轴信息
      name: 'Expansion Ratio (%)',
      nameLocation: 'middle',
      nameGap: 40,
      min: 0,
      max: yAxisMax
    },
    series: series
  }
})

watch(chartOptions, (newOptions, oldOptions) => {
  // Avoid re-rendering for minor data fluctuations if structure is the same
  if (myChart && JSON.stringify(newOptions.series) !== JSON.stringify(oldOptions?.series)) {
    myChart.setOption(newOptions, false) // Use false to avoid full redraw for smoother updates
  } else if (myChart) {
    myChart.setOption(newOptions, { notMerge: true, lazyUpdate: true })
  }
})

// More efficient watch for just data updates
watch(currentChartData, (newData) => {
  if (myChart) {
    const option = {
      series: algorithms.map((algo) => ({
        name: algo,
        data: newData.map((item: { [x: string]: any }) => item[algo])
      }))
    }
    myChart.setOption(option)
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
