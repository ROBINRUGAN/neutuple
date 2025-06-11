<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">内存消耗对比</div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 320px"
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
  globalStore.registerRefreshFunction('transexp4', () => {
    // 使用新的唯一key
    selectedCategory.value = globalStore.ruleCategory
  })
  globalStore.registerClearFunction('transexp4', () => {
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

// ✨ 1. 数据重构：将所有数据按 acl, fw, ipc 分组
const originalData = {
  acl: {
    CutTSS: [
      { r: 0, os: 20, tt: 1.8, tp: 1 },
      { r: 20, os: 20, tt: 2, tp: 1.5 },
      { r: 40, os: 22, tt: 2.5, tp: 2 },
      { r: 60, os: 22, tt: 3, tp: 2.5 },
      { r: 80, os: 22, tt: 3.5, tp: 3 },
      { r: 100, os: 22, tt: 4, tp: 3.5 }
    ],
    TabTree: [
      { r: 0, os: 22, tt: 2, tp: 1.5 },
      { r: 20, os: 22, tt: 2.5, tp: 2 },
      { r: 40, os: 22, tt: 3, tp: 2.5 },
      { r: 60, os: 22, tt: 3.5, tp: 3 },
      { r: 80, os: 22, tt: 4, tp: 3.5 },
      { r: 100, os: 22, tt: 4.5, tp: 4 }
    ],
    MBitTree: [
      { r: 0, os: 23, tt: 2.5, tp: 2 },
      { r: 20, os: 23, tt: 3, tp: 2.5 },
      { r: 40, os: 23, tt: 3.5, tp: 3 },
      { r: 60, os: 23, tt: 4, tp: 3.5 },
      { r: 80, os: 23, tt: 4.5, tp: 4 },
      { r: 100, os: 23, tt: 5, tp: 4.5 }
    ]
  },
  fw: {
    CutTSS: [
      { r: 0, os: 23, tt: 2, tp: 1.5 },
      { r: 20, os: 23, tt: 2.5, tp: 2 },
      { r: 40, os: 23, tt: 3, tp: 2.5 },
      { r: 60, os: 23, tt: 3.5, tp: 3 },
      { r: 80, os: 23, tt: 4, tp: 3.5 },
      { r: 100, os: 23, tt: 4.5, tp: 4 }
    ],
    TabTree: [
      { r: 0, os: 24, tt: 2.5, tp: 2 },
      { r: 20, os: 24, tt: 3, tp: 2.5 },
      { r: 40, os: 24, tt: 3.5, tp: 3 },
      { r: 60, os: 24, tt: 4, tp: 3.5 },
      { r: 80, os: 24, tt: 4.5, tp: 4 },
      { r: 100, os: 24, tt: 5, tp: 4.5 }
    ],
    MBitTree: [
      { r: 0, os: 24, tt: 3, tp: 2.5 },
      { r: 20, os: 24, tt: 3.5, tp: 3 },
      { r: 40, os: 24, tt: 4, tp: 3.5 },
      { r: 60, os: 24, tt: 4.5, tp: 4 },
      { r: 80, os: 24, tt: 5, tp: 4.5 },
      { r: 100, os: 24, tt: 5.5, tp: 5 }
    ]
  },
  ipc: {
    CutTSS: [
      { r: 0, os: 22, tt: 2.5, tp: 2 },
      { r: 20, os: 22, tt: 3, tp: 2.5 },
      { r: 40, os: 22, tt: 3.5, tp: 3 },
      { r: 60, os: 22, tt: 4, tp: 3.5 },
      { r: 80, os: 22, tt: 4.5, tp: 4 },
      { r: 100, os: 22, tt: 5, tp: 4.5 }
    ],
    TabTree: [
      { r: 0, os: 23, tt: 3, tp: 2.5 },
      { r: 20, os: 23, tt: 3.5, tp: 3 },
      { r: 40, os: 23, tt: 4, tp: 3.5 },
      { r: 60, os: 23, tt: 4.5, tp: 4 },
      { r: 80, os: 23, tt: 5, tp: 4.5 },
      { r: 100, os: 23, tt: 5.5, tp: 5 }
    ],
    MBitTree: [
      { r: 0, os: 23, tt: 3.5, tp: 3 },
      { r: 20, os: 23, tt: 4, tp: 3.5 },
      { r: 40, os: 23, tt: 4.5, tp: 4 },
      { r: 60, os: 23, tt: 5, tp: 4.5 },
      { r: 80, os: 23, tt: 5.5, tp: 5 },
      { r: 100, os: 23, tt: 6, tp: 5.5 }
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
        ].map((item) => ({
          ...item,
          os: parseFloat((item.os * (0.95 + Math.random() * 0.1)).toFixed(2)),
          tt: parseFloat((item.tt * (0.95 + Math.random() * 0.1)).toFixed(2)),
          tp: parseFloat((item.tp * (0.95 + Math.random() * 0.1)).toFixed(2))
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

// --- 4. ECharts 配置项生成函数 ---

function getChartOptions(isUpdate = false) {
  const categoryKey = selectedCategory.value as keyof typeof liveData.value
  const dataForCategory = liveData.value[categoryKey]

  const seriesNames = ['Original Structure', 'TransTuple w/ TSS', 'TransTuple w/ PickTSS']
  const dataKeys = ['os', 'tt', 'tp']

  // ✨ 1. 修改数据生成逻辑，同时创建两层X轴所需的数据
  const xAxisData: string[] = [] // 用于存放百分比 (0%, 20%...)
  const xAxisGroupData: string[] = [] // ✨ 新增：用于存放分组标签 (CutTSS...)
  const seriesData: number[][] = [[], [], []]

  if (dataForCategory) {
    const methods = ['CutTSS', 'TabTree', 'MBitTree']
    methods.forEach((method) => {
      // 添加分隔符
      if (xAxisData.length > 0) {
        xAxisData.push('')
        seriesData.forEach((s) => s.push(NaN))
      }

      const points = dataForCategory[method as keyof typeof dataForCategory]
      const pointCount = points.length

      // 生成百分比轴的数据
      points.forEach((item: { r: any }) => {
        xAxisData.push(`${item.r}%`)
      })

      // ✨ 2. 生成分组轴的数据 (只在中间位置显示标签)
      const groupLabelPlacement = new Array(pointCount).fill('') // 创建一个全是空字符串的数组
      // 将分组名放在中间位置
      groupLabelPlacement[Math.floor((pointCount - 1) / 2)] = method
      xAxisGroupData.push(...groupLabelPlacement)

      // 生成系列数据
      points.forEach((item: { os: number; tt: number; tp: number }) => {
        seriesData[0].push(item.os)
        seriesData[1].push(item.tt)
        seriesData[2].push(item.tp)
      })
    })
  }

  const seriesConfig = seriesNames.map((name, index) => {
    let style = {}
    switch (name) {
      case 'Original Structure':
        style = {
          itemStyle: { color: '#5470c6', borderColor: '#5470c6', borderWidth: 2 },
          barGap: '-100%'
        }
        break
      case 'TransTuple w/ TSS':
        style = {
          itemStyle: {
            color: '#9d5cb1',
            decal: { symbol: 'rect', rotation: Math.PI / 4, color: 'rgba(255,255,255,0.5)' }
          }
        }
        break
      case 'TransTuple w/ PickTSS':
        style = {
          itemStyle: {
            color: '#e62429',
            decal: { symbol: 'line', rotation: -Math.PI / 4, color: 'rgba(255,255,255,0.5)' }
          }
        }
        break
    }
    return { name, type: 'bar', data: seriesData[index], ...style }
  })

  // 对于更新操作，我们只传递变化的数据
  if (isUpdate) {
    // ✨ 注意：更新时也要同时更新两个 xAxis
    return {
      xAxis: [{ data: xAxisData }],
      series: seriesConfig
    }
  }

  // ✨ 3. 修改 ECharts 的完整配置，将 xAxis 改为数组形式
  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: seriesNames, bottom: 0 },
    // 将 grid 的 bottom 调大一点，为新的 x 轴标签留出空间
    grid: { top: '5%', left: '7%', right: '4%', bottom: '7%', containLabel: true },

    // ✨ 将 xAxis 从一个对象变成一个包含两个对象的数组
    xAxis: [
      // ✨ 第一个 x 轴 (上层，显示百分比)
      {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          interval: 0,
          rotate: 30
        },
        axisTick: {
          alignWithLabel: true
        },
        position: 'bottom'
      },
      // ✨ 第二个 x 轴 (下层，显示分组标签)
      {
        type: 'category',
        data: ['CutTSS', '', 'TabTree', '', 'MBitTree'],
        position: 'bottom',
        offset: 20, // ✨ 向下偏移，与第一个轴拉开距离
        axisLine: {
          show: false // 不显示轴线
        },
        axisTick: {
          show: false // 不显示刻度
        },
        axisLabel: {
          color: '#333', // 标签颜色
          fontSize: 14, // 字体大小
          fontWeight: 'bold' // 加粗
        }
      }
    ],
    yAxis: { type: 'value', name: 'Byte / Rule', nameLocation: 'middle', nameGap: 35, max: 25 },
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
