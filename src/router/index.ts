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

    // Settings (render same layout but show settings pane)
    {
        path: '/settings',
        name: 'Settings',
        component: BaseView,
    },

    // Mail deep-link (renders layout and opens the specified message)
    {
        path: '/mails/:id',
        name: 'Mail',
        component: BaseView,
        props: true
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