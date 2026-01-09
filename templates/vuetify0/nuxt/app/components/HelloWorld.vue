<script setup lang="ts">
  import { Selection } from '@vuetify/v0'
  import { ref } from 'vue'

  const components = [
    { id: 'selection', label: 'Selection' },
    { id: 'dialog', label: 'Dialog' },
    { id: 'popover', label: 'Popover' },
  ]

  const selected = ref<string[]>(['selection'])

  const links = [
    { label: 'Getting Started', href: 'https://0.vuetifyjs.com/introduction/getting-started' },
    { label: 'Guide', href: 'https://0.vuetifyjs.com/guide' },
    { label: 'Components', href: 'https://0.vuetifyjs.com/components' },
    { label: 'Composables', href: 'https://0.vuetifyjs.com/composables' },
    { label: 'MCP Server', href: 'https://0.vuetifyjs.com/guide/vuetify-mcp' },
  ]
</script>

<template>
  <div class="max-w-2xl mx-auto justify-self-center">
    <!-- Hero -->
    <div class="text-center mb-12">
      <img
        alt="Vuetify0 logo"
        class="mx-auto mb-4"
        height="80"
        src="https://cdn.vuetifyjs.com/docs/images/one/logos/vzero.svg"
        width="92"
      >
      <h1 class="text-4xl font-bold text-on-background mb-3">
        Vuetify0
      </h1>
      <p class="text-on-background opacity-60">
        Headless components for Vue 3
      </p>
    </div>

    <!-- Links -->
    <div class="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mb-8">
      <template v-for="(link, index) in links" :key="link.label">
        <a
          class="text-sm text-primary hover:underline"
          :href="link.href"
          rel="noopener noreferrer"
          target="_blank"
        >
          {{ link.label }}<span class="sr-only"> (opens in new tab)</span>
        </a>
        <span v-if="index < links.length - 1" class="text-on-surface opacity-30">•</span>
      </template>
    </div>

    <!-- Interactive Demo -->
    <div class="rounded-xl border border-subtle bg-surface p-6">
      <div class="text-xs font-medium text-on-surface opacity-50 uppercase tracking-wide mb-4">
        Live Demo — Selection
      </div>

      <Selection.Root v-slot="{ attrs }" v-model="selected" multiple>
        <div aria-label="Select components" v-bind="attrs" class="flex gap-3 mb-4">
          <Selection.Item
            v-for="item in components"
            :key="item.id"
            v-slot="{ isSelected, toggle }"
            :value="item.id"
          >
            <button
              :aria-selected="isSelected"
              class="flex-1 px-4 py-3 rounded-lg border font-medium transition-colors"
              :class="isSelected
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-tint hover:bg-surface-variant border-subtle'"
              role="option"
              type="button"
              @click="toggle"
              @keydown.enter.prevent="toggle"
              @keydown.space.prevent="toggle"
            >
              {{ item.label }}
            </button>
          </Selection.Item>
        </div>

        <p aria-live="polite" class="text-sm text-on-surface opacity-50" role="status">
          Selected: <span class="font-mono">{{ selected.length > 0 ? selected.join(', ') : 'none' }}</span>
        </p>
      </Selection.Root>
    </div>
  </div>
</template>
