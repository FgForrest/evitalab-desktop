<script setup lang="ts">

import { computed } from 'vue'
import { ConnectionDto } from '../../../common/ipc/connection/model/ConnectionDto'
import { computeShortConnectionName } from '../../../common/util/connection'

const props = defineProps<{
    connection: ConnectionDto
}>()

const shortName = computed<string>(() => {
    return computeShortConnectionName(props.connection.name)
})
</script>

<template>
    <VAvatar size="32" :color="connection.styling.color" border="sm">
        <span>{{ shortName }}</span>
    </VAvatar>
</template>

<style lang="scss" scoped>

</style>
