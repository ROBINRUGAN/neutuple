<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">
    处理时间对比 (Processing Time)
  </div>

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
  // ✨ 使用新的key来注册函数，防止与上一个图表冲突
  globalStore.registerRefreshFunction('procexp', () => {
    selectedCategory.value = globalStore.ruleCategory
  })
  globalStore.registerClearFunction('procexp', () => {
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

// ✨ 1. 数据重构：根据新的论文图 (Fig. 12) 更新数据结构和数值
const originalData = {
  acl: {
    CutTSS: [
      { r: 20, rec: 850, tra: 1.2 },
      { r: 40, rec: 850, tra: 2.5 },
      { r: 60, rec: 850, tra: 3.0 },
      { r: 80, rec: 850, tra: 3.5 },
      { r: 100, rec: 850, tra: 4.0 }
    ],
    TabTree: [
      { r: 20, rec: 1000, tra: 0.4 },
      { r: 40, rec: 1000, tra: 0.8 },
      { r: 60, rec: 1000, tra: 1.2 },
      { r: 80, rec: 1000, tra: 1.8 },
      { r: 100, rec: 1000, tra: 2.5 }
    ],
    MBitTree: [
      { r: 20, rec: 800, tra: 0.4 },
      { r: 40, rec: 800, tra: 2.0 },
      { r: 60, rec: 800, tra: 3.0 },
      { r: 80, rec: 800, tra: 4.0 },
      { r: 100, rec: 800, tra: 4.5 }
    ]
  },
  fw: {
    CutTSS: [
      { r: 20, rec: 900, tra: 1.0 },
      { r: 40, rec: 900, tra: 2.0 },
      { r: 60, rec: 900, tra: 2.5 },
      { r: 80, rec: 900, tra: 3.0 },
      { r: 100, rec: 900, tra: 3.8 }
    ],
    TabTree: [
      { r: 20, rec: 1000, tra: 0.3 },
      { r: 40, rec: 1000, tra: 0.7 },
      { r: 60, rec: 1000, tra: 1.1 },
      { r: 80, rec: 1000, tra: 1.5 },
      { r: 100, rec: 1000, tra: 2.3 }
    ],
    MBitTree: [
      { r: 20, rec: 900, tra: 0.3 },
      { r: 40, rec: 900, tra: 1.0 },
      { r: 60, rec: 900, tra: 1.5 },
      { r: 80, rec: 900, tra: 2.0 },
      { r: 100, rec: 900, tra: 2.5 }
    ]
  },
  ipc: {
    CutTSS: [
      { r: 20, rec: 950, tra: 1.5 },
      { r: 40, rec: 950, tra: 2.2 },
      { r: 60, rec: 950, tra: 3.5 },
      { r: 80, rec: 950, tra: 4.5 },
      { r: 100, rec: 950, tra: 6.0 }
    ],
    TabTree: [
      { r: 20, rec: 1000, tra: 0.5 },
      { r: 40, rec: 1000, tra: 0.9 },
      { r: 60, rec: 1000, tra: 1.4 },
      { r: 80, rec: 1000, tra: 1.9 },
      { r: 100, rec: 1000, tra: 2.8 }
    ],
    MBitTree: [
      { r: 20, rec: 950, tra: 0.4 },
      { r: 40, rec: 950, tra: 1.2 },
      { r: 60, rec: 950, tra: 1.8 },
      { r: 80, rec: 950, tra: 2.3 },
      { r: 100, rec: 950, tra: 3.0 }
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
        ] = originalData[catKey as keyof typeof originalData][
          methodKey as keyof (typeof originalData)['acl']
          // ✨ 2. 更新随机数据生成逻辑的键名
        ].map((item) => ({
          ...item,
          rec: parseFloat((item.rec * (0.98 + Math.random() * 0.04)).toFixed(2)),
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
  const seriesNames = ['Reconstruction', 'TransTuple']
  const dataKeys = ['rec', 'tra']

  const xAxisData: string[] = []
  const seriesData: number[][] = [[], []] // 现在只有2个系列

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

      // 生成系列数据
      points.forEach((item: { rec: number; tra: number }) => {
        seriesData[0].push(item.rec)
        seriesData[1].push(item.tra)
      })
    })
  }

  // ✨ 4. 更新系列配置，适配新的图例和样式
  const seriesConfig = seriesNames.map((name, index) => {
    let style = {}
    switch (name) {
      case 'Reconstruction':
        style = {
          itemStyle: {
            color: '#5470c6', // 保持紫色
            // 添加纹理，模拟原图样式
            decal: { symbol: 'rect', rotation: Math.PI / 4, color: 'rgba(255,255,255,0.4)' }
          }
        }
        break
      case 'TransTuple':
        style = {
          itemStyle: {
            color: '#91cc75' // 使用绿色
          }
        }
        break
    }
    // 关键：不再使用 barGap: '-100%'，让柱子并列显示
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
        offset: 45, // 增加偏移，为旋转的label留出空间
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#333', fontSize: 14, fontWeight: 'bold' }
      }
    ],
    // ✨ 5. 修改 Y 轴为对数轴 (log)
    yAxis: {
      type: 'log',
      name: 'Processing Time (ms)',
      nameLocation: 'middle',
      nameGap: 50, // 适当增加间距以容纳更宽的对数标签
      logBase: 10 // 明确指定对数底为10
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
