<script setup lang="ts">

import Header from './Header.vue'
import ConnectionList from './ConnectionList.vue'
import Footer from './Footer.vue'

const props = withDefaults(defineProps<{
    modelValue?: boolean
}>(), {
    modelValue: true
})
</script>

<template>
    <VNavigationDrawer :model-value="modelValue" permanent :width="350">
        <template #prepend>
            <Header />
        </template>

        <template #default>
            <ConnectionList />
        </template>

        <template #append>
            <Footer />
        </template>
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>

</style>
