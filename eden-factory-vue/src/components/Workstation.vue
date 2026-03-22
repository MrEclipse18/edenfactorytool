<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AppConfig } from '../types';
import { useWorkstation } from '../utils/workstation';
import { getWikiUrl } from '../utils/wikiIcons';
import { getStackSize } from '../utils/stackSizes';
import BreakdownTree from './BreakdownTree.vue';

const props = defineProps<{
  config: AppConfig;
}>();

const { 
  items, 
  removeItem, 
  toggleItem, 
  updateAmount, 
  toggleExpand,
  clearWorkstation, 
  totalBreakdown 
} = useWorkstation(props.config);
let hovered = ref(false);

const workstationEntries = computed(() => {
  return items.value.map(item => {
    if (item.type === 'factory') {
      const f = props.config.factories[item.id];
      return { ...item, name: f?.name || item.id, icon: null };
    } else {
      const r = props.config.recipes[item.id];
      const output = Object.values(r?.output || {})[0];
      return { 
        ...item, 
        name: r?.name || item.id, 
        icon: output ? getWikiUrl(output.type) : null 
      };
    }
  }).sort((a, b) => b.timestamp - a.timestamp);
});

function getIcon(type: string) {
  return getWikiUrl(type);
}

function formatName(type: string, display_name: string | null) {
  if (display_name) return display_name;
  return type.split('_').map(w => (w[0] || '').toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function getStacks(type: string, amount: number): string {
  const size = getStackSize(type);
  if (size <= 1) return '';
  const stacks = amount / size;
  if (stacks % 1 === 0) return `${stacks} stack${stacks !== 1 ? 's' : ''}`;
  return `${stacks.toFixed(1)} stack${stacks !== 1 ? 's' : ''}`;
}
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-8">
    <!-- Left Column: Workstation Items -->
    <div class="flex flex-col gap-6 ">
      <div class="flex justify-between items-center border-b border-border2 pb-4">
        <h2 class="font-cinzel text-xl text-gold">Workstation Planner</h2>
        <button 
          @click="clearWorkstation"
          class="text-sm text-red hover:underline font-cinzel tracking-wider"
          v-if="items.length > 0"
        >
          Clear All
        </button>
      </div>

      <div v-if="workstationEntries.length === 0" class="text-center py-20 text-text3 italic">
        Your workstation is empty. Add factories or recipes to start planning.
      </div>

      <div class="flex flex-col gap-3 relative " >
        <div 
          v-for="entry in workstationEntries" 
          :key="entry.id + entry.type"
          class="bg-bg2 border border-border rounded-lg p-4 flex items-center gap-4 transition-all"
          :class="{ 'opacity-50 grayscale-[50%]': !entry.enabled }"
          @mouseover="hovered = true"
  @mouseleave="hovered = false"
        >
        <label class="inline-flex items-center cursor-pointer">
  <input 
    type="checkbox" 
    :checked="entry.enabled" 
    @change="toggleItem(entry.id, entry.type)"
    class="appearance-none w-4 h-4 rounded-md bg-purple-200 checked:bg-purple-600 checked:ring-2 checked:ring-purple-400 transition duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-300"
  />
</label>
          
          <div class="w-10 h-10 bg-bg3 rounded flex items-center justify-center border border-border2">
            <img v-if="entry.icon" :src="entry.icon" class="w-8 h-8 pixelated" />
            <span v-else class="text-xs text-text3 font-cinzel">{{ (entry as any).type ? (entry as any).type[0].toUpperCase() : '?' }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-white font-semibold truncate">{{ entry.name }}</div>
            <div class="text-[0.7rem] text-text3 font-cinzel uppercase tracking-tighter">{{ entry.type }}</div>
          </div>

          <div class="flex items-center gap-3">
            <div v-if="entry.type === 'recipe'" class="flex flex-col  mr-[30px] items-start">
  <label class="text-[0.65rem] text-text3 font-cinzel uppercase mb-1">
    Runs
  </label>
  <input 
    type="number" 
    :value="entry.amount"
    @input="e => updateAmount(entry.id, entry.type, parseInt((e.target as HTMLInputElement).value))"
    class="w-20 bg-bg3 border border-border2 rounded p-1 text-center text-white focus:border-purple2 outline-none"
    min="1"
  />
</div>
            
            <button 
              @click="removeItem(entry.id, entry.type)"
              v-if="hovered"
              class="absolute top-0 right-1 cursor-pointer text-text3 hover:text-red transition-colors p-2"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Shopping List / Breakdown -->
    <div class="flex flex-col gap-6">
      <div class="bg-bg2 border border-border2 rounded-xl p-6 sticky top-[100px]">
        <h3 class="font-cinzel text-lg text-gold mb-1">Shopping List</h3>
        <p class="text-[0.7rem] text-text3 uppercase tracking-widest mb-4">Base Materials Required</p>
        
        <div v-if="!totalBreakdown || totalBreakdown.length === 0" class="text-text3 italic text-sm py-4">
          Enable items to see required materials.
        </div>

        <div v-else class="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-2 custom-scroll">
          <BreakdownTree 
            v-for="node in totalBreakdown" 
            :key="node.key" 
            :node="node" 
            :toggle-expand="toggleExpand"
            :format-name="formatName"
            :get-stacks="getStacks"
            :get-icon="getIcon"
          />
        </div>

        <div v-if="totalBreakdown && totalBreakdown.length > 0" class="mt-6 pt-4 border-t border-border">
          <p class="text-[0.65rem] text-text3 italic leading-tight">
            Click <strong class="text-purple2">Breakdown</strong> on crafted items (like Steel) to see their ingredients instead.
          </p>
        </div>
      </div>
    </div>
  </div>
  <p class="absolute bottom-0 italic text-xs">This feature is new and still in testing! Feel free to leave feedback on the github page</p>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
</style>
