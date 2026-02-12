<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>
<template>
    <div class="flex flex-col items-center justify-center h-screen text-center px-4">
        <div class="space-y-6">
            <h1 class="text-4xl font-bold text-gray-800">{{ t('errors.pageNotFound') }}</h1>
            <p class="text-xl text-gray-600">{{ t('errors.pageNotFoundDescription') }}</p>
            <router-link to="/" class="inline-block text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-300">
                {{ t('actions.backToEntity', { entity: 'home' }) }}
            </router-link>
        </div>
    </div>
</template>