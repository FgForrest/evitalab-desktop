<script setup lang="ts">

import Header from './Header.vue'
import ConnectionList from './ConnectionList.vue'
import Footer from './Footer.vue'
</script>

<template>
    <VNavigationDrawer permanent :width="350">
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
