<script setup lang="ts">
/**
 * Wrapper around Markdown renderer mainly for global styling purposes.
 */

import MarkdownIt from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'
import { computed } from 'vue'

const markdown: MarkdownIt = new MarkdownIt()
    .use(emoji)

const props = withDefaults(defineProps<{
    source?: string
}>(), {
    source: ''
})

const renderedSource = computed<string>(() => markdown.render(props.source))
</script>

<template>
    <div v-html="renderedSource" class="md-content"/>
</template>

<style lang="scss" scoped>

</style>
