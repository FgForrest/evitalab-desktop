<script setup lang="ts">
/**
 * Navigation panel header with manage options
 */

import ManageMenu from './ManageMenu.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
    <VListItem class="navigation-panel-header">
        <template #prepend>
            <VAvatar size="30px">
                <VImg
                    alt="evitaLab Logo"
                    width="30px"
                    height="30px"
                    src="/logo/evitalab-logo-mini.png?raw=true"
                />
            </VAvatar>
        </template>

        <template #title>
            <strong>{{ t('app.name') }}</strong>
        </template>

        <template #append>
            <ManageMenu />
        </template>
    </VListItem>

    <VDivider/>
</template>

<style lang="scss" scoped>
.navigation-panel-header {
    height: 3.5rem;
}
</style>
