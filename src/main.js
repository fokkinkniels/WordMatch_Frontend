import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'

const app = createApp(App)

//global variables
app.config.globalProperties.$axios = axios
  
axios.defaults.baseURL = process.env.VUE_APP_BASE_URL_API
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.put['Content-Type'] = 'application/json';


app.mount('#app')