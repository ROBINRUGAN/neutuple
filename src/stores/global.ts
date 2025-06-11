import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
export const useGlobalStore = defineStore(
  'global',
  () => {
    const packetType = ref('effimatch')
    const ruleCategory = ref('acl')
    const ruleScale = ref('10k')
    const ruleType = ref('类型1')
    const isStarted = ref(false)

    const availableRuleTypes = computed(() => {
      if (ruleCategory.value === 'ipc') {
        return ['类型1', '类型2']
      }
      return ['类型1', '类型2', '类型3', '类型4', '类型5']
    })

    watch(ruleCategory, () => {
      if (!availableRuleTypes.value.includes(ruleType.value)) {
        // 如果当前选择的类型在新类别中不存在，则自动选择第一个可用的类型
        ruleType.value = availableRuleTypes.value[0]
      }
    })

    const createPackets = () => {
      ElMessage({
        message: '开始下发',
        type: 'success',
        duration: 2000
      })
      isStarted.value = true
      refreshAllCharts()
    }

    const stopPackets = () => {
      ElMessage({
        message: '停止成功',
        type: 'warning',
        duration: 2000
      })
      isStarted.value = false
      clearAllCharts()
    }

    const refreshFunctions = ref<{ [key: string]: (size: string) => void }>({})
    const clearFunctions = ref<{ [key: string]: () => void }>({})

    const registerRefreshFunction = (chartId: string, refreshFunction: (size: string) => void) => {
      refreshFunctions.value[chartId] = refreshFunction
    }

    const registerClearFunction = (chartId: string, clearFunction: () => void) => {
      clearFunctions.value[chartId] = clearFunction
    }

    const refreshAllCharts = () => {
      Object.values(refreshFunctions.value).forEach((refresh) => refresh(ruleScale.value))
    }

    const clearAllCharts = () => {
      Object.values(clearFunctions.value).forEach((clear) => clear())
    }

    return {
      packetType,
      ruleCategory,
      ruleScale,
      ruleType,
      isStarted,
      availableRuleTypes,
      createPackets,
      stopPackets,
      registerRefreshFunction,
      refreshAllCharts,
      registerClearFunction,
      clearAllCharts
    }
  },
  {
    persist: true
  }
)
