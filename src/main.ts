import { createApp } from 'vue'
import i18n from "./i18n"
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura';
import router from './router';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { definePreset } from '@primeuix/themes';
const app = createApp(App)

const MyPreset = definePreset(Aura, {

    // semantic: {
    //     primary: {
    //         50: '#f0f9fa',
    //         100: '#d9f0f2',
    //         200: '#b6e1e6',
    //         300: '#85ccd4',
    //         400: '#4db0bc',
    //         500: '#1C6672', // colore principale
    //         600: '#185761',
    //         700: '#174a52',
    //         800: '#173e45',
    //         900: '#17353b',
    //         950: '#0a2025'
    //     }
    // }
});
app.use(i18n);
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: 'light',
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue'
            },

        }
    }
});
app.use(ToastService);
app.use(router);
app.directive('tooltip', Tooltip);

router.isReady().then(() => {
    app.mount('#app');
});