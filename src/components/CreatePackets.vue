<template>
  <div class="form-container">
    <h3 style="margin: 15px 0; font-size: 18px">数据包和规则集生成</h3>

    <div class="form-item">
      <label for="packet-type-select">数据包类型:</label>
      <el-select
        :disabled="globalStore.isStarted"
        id="packet-type-select"
        v-model="globalStore.packetType"
        placeholder="选择数据包类型"
      >
        <el-option label="普通数据包" value="effimatch"></el-option>
        <el-option label="梯度数据包" value="dhc"></el-option>
      </el-select>
    </div>

    <!-- <div class="form-item">
      <label for="rule-category-select">规则集类别:</label>
      <el-select
        :disabled="globalStore.isStarted"
        id="rule-category-select"
        v-model="globalStore.ruleCategory"
        placeholder="选择规则集类别"
      >
        <el-option label="acl" value="acl"></el-option>
        <el-option label="fw" value="fw"></el-option>
        <el-option label="ipc" value="ipc"></el-option>
      </el-select>
    </div> -->

    <div class="form-item">
      <label for="rule-scale-select">规则集规模:</label>
      <el-select
        :disabled="globalStore.isStarted"
        id="rule-scale-select"
        v-model="globalStore.ruleScale"
        placeholder="选择规则集规模"
      >
        <el-option label="1k" value="1k"></el-option>
        <el-option label="10k" value="10k"></el-option>
        <el-option label="100k" value="100k"></el-option>
      </el-select>
    </div>

    <!-- <div class="form-item">
      <label for="rule-type-select">规则集类型:</label>
      <el-select
        id="rule-type-select"
        :disabled="globalStore.isStarted"
        v-model="globalStore.ruleType"
        placeholder="选择规则集类型"
      >
        <el-option
          v-for="item in globalStore.availableRuleTypes"
          :key="item"
          :label="item"
          :value="item"
        ></el-option>
      </el-select>
    </div> -->

    <div class="form-item">
      <el-button v-if="!globalStore.isStarted" type="primary" @click="globalStore.createPackets"
        >开始持续生成下发</el-button
      >
      <el-button v-if="globalStore.isStarted" type="danger" @click="globalStore.stopPackets"
        >停止持续生成下发</el-button
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useGlobalStore } from '@/stores/global'
const globalStore = useGlobalStore()
</script>

<style scoped>
.form-container {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  width: 80%;
  justify-content: center;
  margin: auto;
}

.form-item {
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 15px;
}

.form-item label {
  margin-top: 5px;
  min-width: 80px;
  margin-right: 8px; /* 标签和选择框之间的间距 */
  font-size: 14px;
  color: #606266;
}

/* 确保 el-select 和 el-button 宽度充满其容器 */
select {
  width: 100%;
  display: flex;
}
button {
  width: 100%;
  display: flex;
}
</style>
