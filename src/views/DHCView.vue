<script setup lang="ts">
import TopoGraph from '@/components/TopoGraph.vue'
import FlowGraph from '@/components/FlowGraph.vue'
import HistoryGraph from '@/components/HistoryGraph.vue'
import EatGraph from '@/components/EatGraph.vue'
import DropGraph from '@/components/DropGraph.vue'
import QueueGraph from '@/components/QueueGraph.vue'
import SwitchList from '@/components/SwitchList.vue'
import CreatePackets from '@/components/CreatePackets.vue'
import EffimatchExp1 from '@/components/effimatch-exp1.vue'
import EffimatchExp2 from '@/components/effimatch-exp2.vue'
import EffimatchExp3 from '@/components/effimatch-exp3.vue'
import EffimatchExp4 from '@/components/effimatch-exp4.vue'
import EffimatchExp5 from '@/components/effimatch-exp5.vue'
import HdcExp4 from '@/components/hdc-exp4.vue'
import HdcExp2 from '@/components/hdc-exp2.vue'
import EffimatchExp6 from '@/components/effimatch-exp6.vue'
import HdcExp1 from '@/components/hdc-exp1.vue'
import HdcExp3 from '@/components/hdc-exp3.vue'
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="8">
      <div class="three-column" style="display: flex; flex-direction: column">
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="24">
            <div class="graph-left-one">
              <CreatePackets />
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="24">
            <div class="graph-left-one">
              <HdcExp3 />
            </div>
          </el-col>
        </el-row>
      </div>
    </el-col>
    <el-col :span="8">
      <div class="three-column" style="display: flex; flex-direction: column">
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="24">
            <div class="graph-left-one">
              <!--              <EffimatchExp4 />-->
              <HdcExp1 />
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <div class="graph-left-one" style="margin-bottom: 20px">
              <!--              <EffimatchExp5 />-->
              <HdcExp2 />
            </div>
          </el-col>
        </el-row>
      </div>
    </el-col>
    <el-col :span="8"
      ><div class="three-column">
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="graph-left-two">
              <HdcExp4 />
            </div>
          </el-col>
        </el-row></div
    ></el-col>
  </el-row>
</template>

<style scoped>
.el-row {
  margin: 0;
}
.el-col {
  border-radius: 4px;
}
.three-column {
  height: 100%;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  margin: 0;
  padding: 20px;
  overflow: hidden;
}
.graph-left-one {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
}
.graph-left-two {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  /* display: flex; */
  justify-content: center;
  align-items: center;
}
.graph-left-three {
  margin-top: 20px;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  /* display: flex; */
  justify-content: center;
  align-items: center;
}
.graph-center-one {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  /* display: flex; */
  justify-content: center;
  align-items: center;
}
.graph-center-two {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  /* display: flex; */
  justify-content: center;
  align-items: center;
}
.graph-center-three {
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  justify-content: center;
  align-items: center;
}
</style>
