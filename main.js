import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import { createPinia } from 'pinia'
App.mpType = 'app'
const pinia = createPinia()
const app = new Vue({
  ...App,
  pinia
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  return {
    app
  }
}
// #endif
