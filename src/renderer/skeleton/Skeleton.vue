<script setup lang="ts">
import NavigationPanel from './component/NavigationPanel.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
    <VApp>
        <NavigationPanel />

        <VMain>
<!--        todo lho welcome page-->
            <h1>{{ t('app.name') }}</h1>
        </VMain>
    </VApp>
</template>
