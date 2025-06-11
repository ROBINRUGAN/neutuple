import { createRouter, createWebHistory } from 'vue-router'
import DHCView from '@/views/DHCView.vue'
import EffimatchView from '@/views/EffimatchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/effimatch',
      name: 'effimatch',
      component: EffimatchView
    },
    {
      path: '/dhcview',
      name: 'dhcview',
      component: DHCView
    },
    {
      path: '/',
      redirect: '/effimatch'
    }
  ]
})

export default router
