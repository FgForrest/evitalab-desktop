<script setup lang="ts">
/**
 * Menu for managing evitaLab and getting help
 */

import { useI18n } from 'vue-i18n'
import { ManageOptionType } from '../model/ManageOptionType'
import { Toaster, useToaster } from '../../notification/service/Toaster'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const options = [
    { type: 'subheader', title: t(`navigation.panel.manage.evitaLabHelp.title`) },
    {
        title: t(`navigation.panel.manage.evitaLabHelp.item.${ManageOptionType.EvitaLabGithub}`),
        value: ManageOptionType.EvitaLabGithub,
        props: {
            prependIcon: 'mdi-github'
        }
    },
    {
        title: t(`navigation.panel.manage.evitaLabHelp.item.${ManageOptionType.DiscussEvitaLab}`),
        value: ManageOptionType.DiscussEvitaLab,
        props: {
            prependIcon: 'mdi-forum-outline'
        }
    },
    {
        title: t(`navigation.panel.manage.evitaLabHelp.item.${ManageOptionType.ReportEvitaLabIssue}`),
        value: ManageOptionType.ReportEvitaLabIssue,
        props: {
            prependIcon: 'mdi-bug'
        }
    },
    { type: 'subheader', title: t(`navigation.panel.manage.evitaDBHelp.title`)},
    {
        title: t(`navigation.panel.manage.evitaDBHelp.item.${ManageOptionType.EvitaDBDocumentation}`),
        value: ManageOptionType.EvitaDBDocumentation,
        props: {
            prependIcon: 'mdi-book-open-variant'
        }
    },
    {
        title: t(`navigation.panel.manage.evitaDBHelp.item.${ManageOptionType.EvitaDBGithub}`),
        value: ManageOptionType.EvitaDBGithub,
        props: {
            prependIcon: 'mdi-github'
        }
    },
    {
        title: t(`navigation.panel.manage.evitaDBHelp.item.${ManageOptionType.DiscussEvitaDB}`),
        value: ManageOptionType.DiscussEvitaDB,
        props: {
            prependIcon: 'mdi-forum-outline'
        }
    },
    {
        title: t(`navigation.panel.manage.evitaDBHelp.item.${ManageOptionType.ReportEvitaDBIssue}`),
        value: ManageOptionType.ReportEvitaDBIssue,
        props: {
            prependIcon: 'mdi-bug'
        }
    },
]

async function handleOptionClick(selected: any): Promise<void> {
    if (selected.length > 0) {
        const option: ManageOptionType = selected[0] as ManageOptionType
        switch (option) {
            case ManageOptionType.EvitaLabGithub:
                // it would be confused for users to distinguish between desktop app and driver app, that why we direct
                // them to desktop app
                window.open('https://github.com/FgForrest/evitalab-desktop', '_blank');
                break
            case ManageOptionType.DiscussEvitaLab:
                window.open('https://discord.gg/VsNBWxgmSw', '_blank');
                break
            case ManageOptionType.ReportEvitaLabIssue:
                // it would be confused for users to distinguish between desktop app and driver app, that why we direct
                // them to desktop app
                window.open('https://github.com/FgForrest/evitalab-desktop/issues', '_blank');
                break
            case ManageOptionType.EvitaDBDocumentation:
                window.open('https://evitadb.io/documentation', '_blank');
                break
            case ManageOptionType.EvitaDBGithub:
                window.open('https://github.com/FgForrest/evitaDB', '_blank');
                break
            case ManageOptionType.DiscussEvitaDB:
                window.open('https://discord.gg/VsNBWxgmSw', '_blank');
                break
            case ManageOptionType.ReportEvitaDBIssue:
                window.open('https://github.com/FgForrest/evitaDB/issues', '_blank');
                break
            default:
                await toaster.error(`Unknown manage option ${selected[0]}`)
        }
    }
}
</script>

<template>
    <VMenu>
        <template #activator="{ props }">
            <VIcon v-bind="props">
                mdi-dots-vertical

                <VTooltip activator="parent">
                    {{ t('panel.button.manage') }}
                </VTooltip>
            </VIcon>
        </template>

        <VList :items="options" @update:selected="handleOptionClick">
            <template #title="{ item }">
                <VListItemTitle>
                    {{ item.title }}
                </VListItemTitle>
            </template>
        </VList>
    </VMenu>
</template>

<style lang="scss" scoped>
.manage-button {
    width: 3.5rem;
    height: 3.5rem;
    display: grid;
    justify-items: center;
    align-items: center;
}
</style>
