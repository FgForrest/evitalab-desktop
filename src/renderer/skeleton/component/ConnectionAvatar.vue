<script setup lang="ts">

import { computed } from 'vue'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'

const props = defineProps<{
    connection: ConnectionDto
}>()

const initials = computed<string>(() => {
    const parts: string[] = props.connection.name.split(/\s+/)
    if (parts.length > 3) {
        return parts.slice(0, 2).map(part => part.substring(0, 1).toUpperCase()).join('') +
            parts.at(-1).substring(0, 1).toUpperCase()
    } else {
        return parts.map(part => part.substring(0, 1).toUpperCase()).join('')
    }
})
</script>

<template>
    <VAvatar size="large">
        <span>{{ initials }}</span>
    </VAvatar>
</template>

<style lang="scss" scoped>

</style>
