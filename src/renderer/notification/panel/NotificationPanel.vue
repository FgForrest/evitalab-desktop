<script setup lang="ts">
/**
 * Displays toast notification from skeleton and instances in one place
 */
import { useToast } from 'vue-toastification'
import { ToastificationIntegrator } from '../service/ToastificationIntegrator'

ToastificationIntegrator.integrate(useToast())
</script>

<template>
    <VApp style="background-color: transparent">
<!--        todo lho print toast source -->
        <!-- placeholder for toastification plugin, that renders its components by itself -->
    </VApp>
</template>

<style lang="scss" scoped>

</style>
