<script setup lang="ts">
import NavigationPanel from './component/NavigationPanel.vue'
import WelcomeScreen from '../welcome-screen/component/WelcomeScreen.vue'

</script>

<template>
    <VApp>
        <NavigationPanel />

        <VMain :scrollable="false" class="main">
            <WelcomeScreen />
        </VMain>
    </VApp>
</template>

<style lang="scss" scoped>
.main {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    justify-items: stretch;
    align-items: stretch;
}
</style>
