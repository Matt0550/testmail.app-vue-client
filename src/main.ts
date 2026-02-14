import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura';
import router from './router';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { definePreset } from '@primeuix/themes';
const app = createApp(App)

const MyPreset = definePreset(Aura, {
});
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