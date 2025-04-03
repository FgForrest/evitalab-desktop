<script setup lang="ts">/**
 * Navigation panel footer with useful info.
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
    <VDivider />

    <footer class="navigation-panel-footer">
        <ul class="lab-nav-links">
            <li>
                <a href="https://evitadb.io/documentation" target="_blank">
                    <img src="/documentation.svg" :alt="t('navigation.panel.link.evitaDBDocumentation.icon.alt')">
                    <VTooltip activator="parent">
                        {{ t('navigation.panel.link.evitaDBDocumentation.tooltip') }}
                    </VTooltip>
                </a>
            </li>
            <li>
                <a href="https://discord.gg/VsNBWxgmSw" target="_blank">
                    <img src="/discord.svg" :alt="t('navigation.panel.link.discord.icon.alt')">
                    <VTooltip activator="parent">
                        {{ t('navigation.panel.link.discord.tooltip') }}
                    </VTooltip>
                </a>
            </li>
        </ul>

        <span class="app-version text-subtitle-2 text-disabled">
<!--                    todo lho version -->
            v2025.1.0
        </span>
    </footer>
</template>

<style lang="scss" scoped>

.navigation-panel-footer {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
    height: 3rem;
}

.lab-nav-links {
    display: flex;
    list-style: none;
    justify-content: center;
    align-items: center;
    margin-left: 1rem;
    gap: 1rem;
}

.lab-nav-links li {
    width: 1.5rem;
    height: 1.5rem;
}

.lab-nav-links li img {
    opacity: .5;
    transition: opacity .2s ease-in-out;
}

.lab-nav-links li:hover img {
    opacity: 1;
}

.app-version {
    display: block;
    text-align: right;
    line-height: 3rem;
    margin-right: 0.5rem;
}
</style>
