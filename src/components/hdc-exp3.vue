<template>
  <div style="margin: 15px 0; font-size: 18px; font-weight: bold">聚合吞吐量</div>

  <div class="form-container">
    <label for="workers-select">选择工人数量: </label>
    <el-select
      id="workers-select"
      v-model="selectedWorkers"
      :style="{ opacity: globalStore.isStarted ? 1 : 0 }"
    >
      <el-option value="2" label="Two Workers"></el-option>
      <el-option value="3" label="Three Workers"></el-option>
      <el-option value="4" label="Four Workers"></el-option>
    </el-select>
  </div>

  <div
    ref="chartContainer"
    style="width: 100%; height: 450px"
    :style="{ opacity: globalStore.isStarted ? 1 : 0 }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '@/stores/global'

// --- 1. 响应式状态定义 ---
const globalStore = useGlobalStore()
const chartContainer = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
let intervalId: number | null = null

const selectedWorkers = ref<'2' | '3' | '4'>('2')

// --- 2. 生命周期和图表实例管理 ---

onMounted(() => {
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

const originalData = {
  '2': [
    {
      name: 'DHC(One Gpu)',
      data: [
        [0, 380],
        [25, 250],
        [50, 150],
        [75, 120],
        [100, 110]
      ]
    },
    {
      name: 'DHC(Two Gpus)',
      data: [
        [0, 370],
        [25, 240],
        [50, 158],
        [75, 123],
        [100, 112]
      ]
    },
    {
      name: 'NCCL',
      data: [
        [0, 110],
        [25, 115],
        [50, 120],
        [75, 115],
        [100, 110]
      ]
    }
  ],
  '3': [
    {
      name: 'DHC(One Gpu)',
      data: [
        [0, 350],
        [25, 230],
        [50, 210],
        [75, 120],
        [100, 100]
      ]
    },
    {
      name: 'DHC(Two Gpus)',
      data: [
        [0, 340],
        [25, 220],
        [50, 190],
        [75, 110],
        [100, 90]
      ]
    },
    {
      name: 'NCCL',
      data: [
        [0, 115],
        [25, 115],
        [50, 118],
        [75, 118],
        [100, 110]
      ]
    }
  ],
  '4': [
    {
      name: 'DHC(One Gpu)',
      data: [
        [0, 350],
        [25, 230],
        [50, 210],
        [75, 100],
        [100, 90]
      ]
    },
    {
      name: 'DHC(Two Gpus)',
      data: [
        [0, 320],
        [25, 210],
        [50, 180],
        [75, 90],
        [100, 70]
      ]
    },
    {
      name: 'NCCL',
      data: [
        [0, 100],
        [25, 100],
        [50, 100],
        [75, 100],
        [100, 100]
      ]
    }
  ]
}

const liveData = ref(JSON.parse(JSON.stringify(originalData)))

function startDataFluctuation() {
  stopDataFluctuation()
  intervalId = window.setInterval(() => {
    for (const key in originalData) {
      const workerKey = key as keyof typeof originalData
      liveData.value[workerKey] = originalData[workerKey].map((seriesItem) => {
        const newSeriesData = seriesItem.data.map((point) => {
          const x = point[0]
          const originalY = point[1]
          const multiplier = 0.9 + Math.random() * 0.2
          const newY = originalY * multiplier
          return [x, parseFloat(newY.toFixed(2))]
        })
        return { ...seriesItem, data: newSeriesData }
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

const currentChartData = computed(() => liveData.value[selectedWorkers.value])

// --- 4. ECharts 配置项 ---

const chartOptions = computed(() => {
  const series = currentChartData.value.map((seriesItem: { name: any; data: any }) => {
    let style = {}
    // ✨ 根据系列名称设置不同样式
    switch (seriesItem.name) {
      case 'DHC(One Gpu)':
        style = { color: '#e62429', lineStyle: { type: 'solid' }, symbol: 'circle' }
        break
      case 'DHC(Two Gpus)':
        style = { color: '#3366cc', lineStyle: { type: 'dashed' }, symbol: 'square' }
        break
      case 'NCCL':
        style = { color: '#4caf50', lineStyle: { type: 'dashed' }, symbol: 'square' }
        break
    }

    return {
      name: seriesItem.name,
      type: 'line',
      data: seriesItem.data,
      symbolSize: 8,
      showSymbol: true, // 显示标记点
      ...style
    }
  })

  return {
    animation: true,
    animationDuration: 500,
    animationDurationUpdate: 500,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { top: '5%', left: '15%', right: '5%', bottom: '20%', containLabel: false },
    xAxis: {
      type: 'value',
      name: 'Compression Ratio',
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    yAxis: {
      type: 'value',
      name: 'Aggregation Thr. (Gps)',
      nameLocation: 'middle',
      nameGap: 50,
      min: 0,
      max: 400
    },
    series: series
  }
})

watch(chartOptions, (newOptions) => {
  if (myChart) {
    myChart.setOption(newOptions, true)
  }
})
</script>

<style scoped>
.form-container {
  font-size: 14px;
  display: flex;
  flex-direction: row;
  width: 80%;
  justify-content: center;
  margin: auto;
}

label {
  margin-top: 5px;
  min-width: 90px;
  margin-right: 8px; /* 标签和选择框之间的间距 */
  font-size: 14px;
  color: #606266;
}

/* 确保 el-select 和 el-button 宽度充满其容器 */
select {
  width: 100%;
  display: flex;
}
select {
  display: flex;
  width: 20px;
}
</style>
