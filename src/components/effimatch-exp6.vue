<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">单次查询偏移分析</div>

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
  // ✨ 向全局Store注册回调，使用新的标识符 'exp6'
  globalStore.registerRefreshFunction('exp6', (size: string) => {
    selectedSize.value = size
  })
  globalStore.registerClearFunction('exp6', () => {
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
    { category: 'acl1', RBIMI: 0.15, RBMI: 0.35, RMI: 0.12 },
    { category: 'acl2', RBIMI: 0.18, RBMI: 0.25, RMI: 0.12 },
    { category: 'acl3', RBIMI: 0.15, RBMI: 0.28, RMI: 0.12 },
    { category: 'acl4', RBIMI: 0.15, RBMI: 0.28, RMI: 0.12 },
    { category: 'acl5', RBIMI: 0.35, RBMI: 0.52, RMI: 0.12 },
    { category: 'fw1', RBIMI: 0.18, RBMI: 0.25, RMI: 0.08 },
    { category: 'fw2', RBIMI: 0.15, RBMI: 0.25, RMI: 0.08 },
    { category: 'fw3', RBIMI: 0.15, RBMI: 0.22, RMI: 0.08 },
    { category: 'fw4', RBIMI: 0.15, RBMI: 0.22, RMI: 0.08 },
    { category: 'fw5', RBIMI: 0.15, RBMI: 0.22, RMI: 0.08 },
    { category: 'ipc1', RBIMI: 0.15, RBMI: 0.22, RMI: 0.08 },
    { category: 'ipc2', RBIMI: 0.25, RBMI: 0.4, RMI: 0.08 }
  ],
  '10k': [
    { category: 'acl1', RBIMI: 0.22, RBMI: 0.25, RMI: 0.12 },
    { category: 'acl2', RBIMI: 0.18, RBMI: 0.2, RMI: 0.12 },
    { category: 'acl3', RBIMI: 0.18, RBMI: 0.28, RMI: 0.12 },
    { category: 'acl4', RBIMI: 0.2, RBMI: 0.32, RMI: 0.12 },
    { category: 'acl5', RBIMI: 0.42, RBMI: 0.62, RMI: 0.12 },
    { category: 'fw1', RBIMI: 0.15, RBMI: 0.15, RMI: 0.08 },
    { category: 'fw2', RBIMI: 0.12, RBMI: 0.15, RMI: 0.08 },
    { category: 'fw3', RBIMI: 0.15, RBMI: 0.18, RMI: 0.08 },
    { category: 'fw4', RBIMI: 0.12, RBMI: 0.18, RMI: 0.08 },
    { category: 'fw5', RBIMI: 0.15, RBMI: 0.18, RMI: 0.08 },
    { category: 'ipc1', RBIMI: 0.2, RBMI: 0.25, RMI: 0.08 },
    { category: 'ipc2', RBIMI: 0.15, RBMI: 0.2, RMI: 0.08 }
  ],
  '100k': [
    { category: 'acl1', RBIMI: 0.12, RBMI: 0.24, RMI: 1.2e-1 },
    { category: 'acl2', RBIMI: 0.12, RBMI: 0.25, RMI: 0.12 },
    { category: 'acl3', RBIMI: 0.12, RBMI: 0.2, RMI: 0.12 },
    { category: 'acl4', RBIMI: 0.18, RBMI: 0.21, RMI: 0.12 },
    { category: 'acl5', RBIMI: 0.21, RBMI: 0.38, RMI: 0.12 },
    { category: 'fw1', RBIMI: 0.12, RBMI: 0.22, RMI: 0.08 },
    { category: 'fw2', RBIMI: 0.12, RBMI: 0.22, RMI: 0.08 },
    { category: 'fw3', RBIMI: 0.12, RBMI: 0.2, RMI: 0.08 },
    { category: 'fw4', RBIMI: 0.12, RBMI: 0.18, RMI: 0.08 },
    { category: 'fw5', RBIMI: 0.15, RBMI: 0.19, RMI: 0.08 },
    { category: 'ipc1', RBIMI: 0.18, RBMI: 0.22, RMI: 0.08 },
    { category: 'ipc2', RBIMI: 0.25, RBMI: 0.31, RMI: 0.08 }
  ]
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

// ✨ 更新为新的算法列表
const algorithms = ['RBIMI', 'RBMI', 'RMI']

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const sizeKey = key as keyof typeof originalData
      liveData.value[sizeKey] = originalData[sizeKey].map((item) => {
        const newItem = { ...item } as { [key: string]: any }
        algorithms.forEach((algo) => {
          const originalValue = item[algo as keyof typeof item] as number
          const multiplier = 0.9 + Math.random() * 0.2
          newItem[algo] = parseFloat((originalValue * multiplier).toFixed(3)) // 保留3位小数以适应数据
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
  if (!globalStore.isStarted || !liveData.value[selectedSize.value]) {
    return []
  }
  return liveData.value[selectedSize.value]
})

// --- 4. ECharts 配置项 ---

const chartOptions = computed(() => {
  const categories = currentChartData.value.map((item: { category: string }) => item.category)

  const series = algorithms.map((algo) => {
    let color, symbol
    // ✨ 更新系列样式
    switch (algo) {
      case 'RBIMI':
        color = '#73b96e'
        symbol = 'circle'
        break
      case 'RBMI':
        color = '#f07c79'
        symbol = 'rect'
        break
      case 'RMI':
        color = '#5b8ff9'
        symbol = 'triangle'
        break
    }

    return {
      name: algo,
      // ✨ 核心修改：图表类型改为 'line'
      type: 'line',
      // ✨ 新增：为折线图添加标记点样式
      symbol: symbol,
      symbolSize: 8,
      data: currentChartData.value.map(
        (item: { [x: string]: any }) => item[algo as keyof typeof item]
      ),
      itemStyle: { color } // 折线图不需要 decal
    }
  })

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      textStyle: { fontSize: 12 },
      // ✨ 让图例也显示标记点形状
      data: algorithms.map((algo) => ({
        name: algo,
        icon: series.find((s) => s.name === algo)?.symbol || 'circle'
      }))
    },
    grid: { top: '15%', left: '7%', right: '4%', bottom: '5%', containLabel: true },
    xAxis: { type: 'category', data: categories },
    yAxis: {
      type: 'value',
      // ✨ 更新Y轴信息
      name: 'ε / Lookup',
      nameLocation: 'middle',
      nameGap: 35,
      // ✨ 设置固定范围以优化视觉
      min: 0,
      max: 0.7
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
