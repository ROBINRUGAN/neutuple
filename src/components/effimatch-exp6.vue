<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">更新速度对比 (Update Speed)</div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 330px"
    :style="{
      opacity: globalStore.isStarted ? 1 : 0
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

// --- 1. 响应式状态定义 ---

const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
const globalStore = useGlobalStore()

const selectedCategory = ref<string>(globalStore.ruleCategory)
let intervalId: number | null = null

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
  // ✨ 使用新的唯一key
  globalStore.registerRefreshFunction('updateexp', () => {
    selectedCategory.value = globalStore.ruleCategory
  })
  globalStore.registerClearFunction('updateexp', () => {
    selectedCategory.value = 'null'
  })
  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value)
    myChart.setOption(getChartOptions())
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

// --- 3. 图表数据 ---

// ✨ 1. 数据重构：根据新的论文图 (Fig. 13) 更新数据
const originalData = {
  acl: {
    CutTSS: [
      { r: 20, ori: 3.0, tra: 0.25 },
      { r: 40, ori: 3.2, tra: 0.3 },
      { r: 60, ori: 3.4, tra: 0.35 },
      { r: 80, ori: 3.6, tra: 0.4 },
      { r: 100, ori: 3.8, tra: 0.45 }
    ],
    TabTree: [
      { r: 20, ori: 800, tra: 0.2 },
      { r: 40, ori: 500, tra: 0.4 },
      { r: 60, ori: 400, tra: 0.6 },
      { r: 80, ori: 300, tra: 0.8 },
      { r: 100, ori: 200, tra: 1.0 }
    ],
    MBitTree: [
      { r: 20, ori: 300, tra: 0.8 },
      { r: 40, ori: 100, tra: 0.7 },
      { r: 60, ori: 80, tra: 0.6 },
      { r: 80, ori: 60, tra: 0.5 },
      { r: 100, ori: 50, tra: 0.4 }
    ]
  },
  fw: {
    CutTSS: [
      { r: 20, ori: 3.1, tra: 0.28 },
      { r: 40, ori: 3.3, tra: 0.32 },
      { r: 60, ori: 3.5, tra: 0.38 },
      { r: 80, ori: 3.7, tra: 0.42 },
      { r: 100, ori: 3.9, tra: 0.48 }
    ],
    TabTree: [
      { r: 20, ori: 500, tra: 0.18 },
      { r: 40, ori: 300, tra: 0.35 },
      { r: 60, ori: 200, tra: 0.45 },
      { r: 80, ori: 150, tra: 0.55 },
      { r: 100, ori: 120, tra: 0.65 }
    ],
    MBitTree: [
      { r: 20, ori: 100, tra: 0.3 },
      { r: 40, ori: 80, tra: 0.28 },
      { r: 60, ori: 60, tra: 0.25 },
      { r: 80, ori: 40, tra: 0.22 },
      { r: 100, ori: 30, tra: 0.2 }
    ]
  },
  ipc: {
    CutTSS: [
      { r: 20, ori: 3.2, tra: 0.24 },
      { r: 40, ori: 3.4, tra: 0.31 },
      { r: 60, ori: 3.6, tra: 0.36 },
      { r: 80, ori: 3.8, tra: 0.41 },
      { r: 100, ori: 4.0, tra: 0.5 }
    ],
    TabTree: [
      { r: 20, ori: 300, tra: 0.22 },
      { r: 40, ori: 200, tra: 0.28 },
      { r: 60, ori: 180, tra: 0.35 },
      { r: 80, ori: 150, tra: 0.45 },
      { r: 100, ori: 120, tra: 0.55 }
    ],
    MBitTree: [
      { r: 20, ori: 200, tra: 0.6 },
      { r: 40, ori: 150, tra: 0.5 },
      { r: 60, ori: 120, tra: 0.4 },
      { r: 80, ori: 90, tra: 0.3 },
      { r: 100, ori: 70, tra: 0.25 }
    ]
  }
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const catKey in originalData) {
      for (const methodKey in originalData[catKey as keyof typeof originalData]) {
        liveData.value[catKey as keyof typeof originalData][
          methodKey as keyof (typeof originalData)['acl']
          // ✨ 2. 更新随机数据生成逻辑的键名
        ] = originalData[catKey as keyof typeof originalData][
          methodKey as keyof (typeof originalData)['acl']
        ].map((item) => ({
          ...item,
          ori: parseFloat((item.ori * (0.98 + Math.random() * 0.04)).toFixed(2)),
          tra: parseFloat((item.tra * (0.95 + Math.random() * 0.1)).toFixed(2))
        }))
      }
    }
  }, 1000)
}

function stopDataFluctuation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// --- 4. ECharts 配置项生成函数 ---

function getChartOptions(isUpdate = false) {
  const categoryKey = selectedCategory.value as keyof typeof liveData.value
  const dataForCategory = liveData.value[categoryKey]

  // ✨ 3. 更新系列名称和数据键名
  const seriesNames = ['Origin', 'TransTuple']
  const dataKeys = ['ori', 'tra']

  const xAxisData: string[] = []
  const seriesData: number[][] = [[], []]

  if (dataForCategory) {
    const methods = ['CutTSS', 'TabTree', 'MBitTree']
    methods.forEach((method) => {
      if (xAxisData.length > 0) {
        xAxisData.push('')
        seriesData.forEach((s) => s.push(NaN))
      }

      const points = dataForCategory[method as keyof typeof dataForCategory]
      points.forEach((item: { r: any }) => {
        xAxisData.push(`${item.r}%`)
      })

      points.forEach((item: { ori: number; tra: number }) => {
        seriesData[0].push(item.ori)
        seriesData[1].push(item.tra)
      })
    })
  }

  // ✨ 4. 更新系列配置，这次两个系列都有纹理
  const seriesConfig = seriesNames.map((name, index) => {
    let style = {}
    switch (name) {
      case 'Origin':
        style = {
          itemStyle: {
            color: '#5470c6',
            decal: { symbol: 'rect', rotation: Math.PI / 4, color: 'rgba(255,255,255,0.4)' }
          }
        }
        break
      case 'TransTuple':
        style = {
          itemStyle: {
            color: '#91cc75',
            // 为绿色系列也添加纹理，使用不同的样式
            decal: { symbol: 'line', rotation: Math.PI / 4, color: 'rgba(0,0,0,0.3)' }
          }
        }
        break
    }
    return { name, type: 'bar', data: seriesData[index], ...style }
  })

  if (isUpdate) {
    return {
      xAxis: [{ data: xAxisData }],
      series: seriesConfig
    }
  }

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: seriesNames, bottom: 0 },
    grid: { top: '8%', left: '7%', right: '4%', bottom: '15%', containLabel: true },

    xAxis: [
      {
        type: 'category',
        data: xAxisData,
        axisLabel: { interval: 0, rotate: 30 },
        axisTick: { alignWithLabel: true },
        position: 'bottom'
      },
      {
        type: 'category',
        data: ['CutTSS', '', 'TabTree', '', 'MBitTree'],
        position: 'bottom',
        offset: 45,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#333', fontSize: 14, fontWeight: 'bold' }
      }
    ],
    // ✨ 5. 更新 Y 轴名称和单位
    yAxis: {
      type: 'log',
      name: 'Update Time (µs)',
      nameLocation: 'middle',
      nameGap: 50,
      logBase: 10
    },
    series: seriesConfig
  }
}

// --- 5. 监听器 ---

watch(
  [liveData, selectedCategory],
  () => {
    if (!myChart || !globalStore.isStarted) {
      myChart?.setOption({ series: [] })
      return
    }
    myChart.setOption(getChartOptions(true))
  },
  { deep: true }
)

watch(
  () => globalStore.isStarted,
  (isStarted) => {
    if (myChart && isStarted) {
      myChart.setOption(getChartOptions())
    } else if (myChart && !isStarted) {
      myChart.setOption({ series: [] })
    }
  }
)
</script>

<style scoped>
/* 样式保持不变 */
</style>
