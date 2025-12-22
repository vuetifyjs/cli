<script setup lang="ts">
import { ExpansionPanelRoot, ExpansionPanelItem } from '@vuetify/v0'
import { ref } from 'vue'

const items = ['Item 1', 'Item 2', 'Item 3']
const selection = ref(['Item 1'])
</script>

<template>
  <div class="max-w-md mx-auto mt-10 space-y-4">
    <h1 class="text-2xl font-bold text-primary">Vuetify 0 + Vue</h1>
    
    <ExpansionPanelRoot v-model="selection" multiple>
      <ExpansionPanelItem
        v-for="item in items"
        :key="item"
        :value="item"
        #default="{ isExpanded, toggle }"
      >
        <div class="border rounded-lg overflow-hidden mb-2">
          <button
            @click="toggle"
            class="w-full px-4 py-2 bg-surface hover:bg-gray-200 flex justify-between items-center text-left"
          >
            <span>{{ item }}</span>
            <span :class="{ 'rotate-180': isExpanded }" class="transition-transform">
              ▼
            </span>
          </button>
          
          <div v-if="isExpanded" class="p-4 bg-white">
            Content for {{ item }}
          </div>
        </div>
      </ExpansionPanelItem>
    </ExpansionPanelRoot>
  </div>
</template>
