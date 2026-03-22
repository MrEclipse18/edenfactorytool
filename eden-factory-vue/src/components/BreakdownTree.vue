<script setup lang="ts">
import type { BreakdownNode } from '../utils/workstation';

defineProps<{
  node: BreakdownNode;
  toggleExpand: (key: string) => void;
  formatName: (type: string, display_name: string | null) => string;
  getStacks: (type: string, amount: number) => string;
  getIcon: (type: string) => string | null;
  depth?: number;
}>();
</script>

<template>
  <div class="flex flex-col gap-1" :style="{ marginLeft: (depth || 0) * 12 + 'px' }">
    <div 
      class="flex items-center gap-3 bg-bg3 border border-border rounded-lg p-2 transition-all"
      :class="node.is_expanded ? 'border-purple/40 bg-purple/5' : ''"
    >
      <div class="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-bg4 rounded border border-border2">
        <img v-if="getIcon(node.type)" :src="getIcon(node.type)!" class="w-6 h-6 pixelated" />
        <span v-else class="text-lg">📦</span>
      </div>
      
      <div class="flex-1 min-w-0">
        <div class="text-white text-xs truncate leading-tight">
          {{ formatName(node.type, node.displayName) }}
        </div>
        <div class="text-gold font-bold text-xs">
          ×{{ node.amount.toLocaleString() }}
          <span class="text-text3 font-normal text-[0.6rem] ml-1" v-if="getStacks(node.type, node.amount)">
            ({{ getStacks(node.type, node.amount) }})
          </span>
        </div>
        <div v-if="node.factoryNames && node.factoryNames.length > 0 && node.can_breakdown" class="text-[0.55rem] text-purple2 font-cinzel mt-0.5 truncate">
          {{ node.factoryNames.join(', ') }}
        </div>
      </div>

      <button 
        v-if="node.can_breakdown"
        @click="toggleExpand(node.key)"
        class="px-2 py-1 rounded border text-[0.6rem] font-cinzel tracking-wider transition-all"
        :class="node.is_expanded 
          ? 'bg-purple/20 border-purple2 text-purple2 hover:bg-purple/30' 
          : 'bg-bg4 border-border2 text-text3 hover:border-purple2 hover:text-purple2'"
      >
        {{ node.is_expanded ? 'Undo' : 'Breakdown' }}
      </button>
    </div>

    <!-- Recursive children -->
    <template v-if="node.is_expanded && node.ingredients">
      <div class="flex flex-col gap-1 border-l border-border2/30 ml-4 pl-2 mt-1 mb-2">
        <BreakdownTree 
          v-for="child in node.ingredients" 
          :key="child.key" 
          :node="child" 
          :toggle-expand="toggleExpand"
          :format-name="formatName"
          :get-stacks="getStacks"
          :get-icon="getIcon"
          :depth="0"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
</style>
