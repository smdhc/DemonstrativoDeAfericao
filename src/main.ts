import { createApp } from 'vue'
import App from './App.vue'

import './global.css'
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

const app = createApp(App);

app.component('VueDatePicker', VueDatePicker);

app.mount('#app');