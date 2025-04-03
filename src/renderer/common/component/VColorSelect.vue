<script setup lang="ts">

import { computed } from 'vue'

const props = withDefaults(defineProps<{
    modelValue?: string
    label: string,
    hint?: string
}>(), {
    modelValue: undefined,
    hint: undefined
})
const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
}>()

const normalizedColor = computed<string | undefined>(() =>
    props.modelValue == undefined || props.modelValue.trim().length === 0 ? undefined : props.modelValue)
const colorFilled = computed<boolean>(() =>
    props.modelValue != undefined && props.modelValue.trim().length > 0)
</script>

<template>
    <VMenu>
        <template #activator="{ props }">
            <VTextField
                :model-value="normalizedColor"
                :label="label"
                readonly
                :hint="hint"
                v-bind="props"
                clearable
                @click:clear="emit('update:modelValue', undefined)"
            >
                <template v-if="colorFilled" #prepend-inner>
                    <VAvatar :color="normalizedColor" size="16"/>
                </template>
            </VTextField>
        </template>

        <template #default>
            <VColorPicker
                :model-value="modelValue"
                hide-canvas
                hide-inputs
                show-swatches
                @update:model-value="emit('update:modelValue', $event)"
            />
        </template>
    </VMenu>
</template>

<style lang="scss" scoped>

</style>
