import BaseView from '@views/BaseView.vue';
import { createRouter, createWebHistory } from 'vue-router';
/**
 * Application routes configuration.
 * Defines all available routes with their components and metadata.
 */
const routes = [
    {
        path: '/',
        name: 'Home',
        component: BaseView,
    },

    // Not Found Route
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@views/NotFoundView.vue'),
    },
];

/**
 * Vue Router instance configured with history mode and defined routes.
 */
const router = createRouter({
    history: createWebHistory(),
    routes
});


export default router;