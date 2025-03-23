<script setup lang="ts">

import { computed } from 'vue'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import { computeShortConnectionName } from '../../../common/utils/connection'

const props = defineProps<{
    connection: ConnectionDto
}>()

const shortName = computed<string>(() => {
    if (props.connection.styling.shortName != undefined) {
        return props.connection.styling.shortName
    }
    return computeShortConnectionName(props.connection.name)
})
</script>

<template>
    <VAvatar size="large" :color="connection.styling.color">
        <span>{{ shortName }}</span>
    </VAvatar>
</template>

<style lang="scss" scoped>

</style>
