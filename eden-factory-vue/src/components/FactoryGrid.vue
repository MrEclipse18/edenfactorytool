<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AppConfig } from '../types';
import { getWikiUrl, FB } from '../utils/wikiIcons';
const hiddenTypes = ref<string[]>([]);

const props = defineProps<{
  config: AppConfig;
  filter: string;
  selectedFactoryId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
}>();

// <-- define reactive state for the dropdown
const filterOptions = ref<'A-Z' | 'Z-A' | 'Citadel Hardness' | 'Recipe Count' | 'Unique Items' | 'Unique Items L-H'>('A-Z');

const filteredFactories = computed(() => {
  const fl = props.filter.toLowerCase();

  // filter factories first
   let factories = Object.values(props.config.factories)
    .filter(f =>
      !fl ||
      f.name.toLowerCase().includes(fl) ||
      f.id.includes(fl) ||
      f.recipes.some(r => {
        const rec = props.config.recipes[r];
        return rec && rec.name.toLowerCase().includes(fl);
      })
    ).filter(f => !hiddenTypes.value.includes(f.type));
  if (filterOptions.value === 'A-Z') {
    factories.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filterOptions.value === 'Z-A') {
    factories.sort((b, a) => a.name.localeCompare(b.name));
  } else if (filterOptions.value === 'Unique Items') {
  factories.sort((a, b) => Object.keys(b.setupcost).length - Object.keys(a.setupcost).length);
  } else if (filterOptions.value === 'Citadel Hardness') {
    factories.sort((a, b) => (b.citadelBreakReduction ?? 0) - (a.citadelBreakReduction ?? 0));
  } else if (filterOptions.value === 'Unique Items L-H') {
    factories.sort((a, b) => Object.keys(a.setupcost).length - Object.keys(b.setupcost).length);
  } else if (filterOptions.value === 'Recipe Count') {
    factories.sort((a, b) => b.recipes.length - a.recipes.length);
  } else if (filterOptions.value === 'Unique Items') {
    factories.sort((b, a) => Object.keys(b.setupcost).length - Object.keys(a.setupcost).length);
  }

  return factories;
});
function toggleType(type: string) {
  if (hiddenTypes.value.includes(type)) {
    hiddenTypes.value = hiddenTypes.value.filter(t => t !== type);
  } else {
    hiddenTypes.value.push(type);
  }
}
function getIconUrl(type: string) {
  return getWikiUrl(type);
}

function getEmoji(type: string) {
  return FB[type] || '📦';
}
</script>

<template>
     
  <div>



    <div class="section-title">
      {{ filter ? `Results — ${filteredFactories.length} factories` : 'All Factories' }}
    </div>
    <div style="display:flex; height:50px;gap:30px; justify-content:space-between">
     <select v-model="filterOptions" class="custom-scroll transition-all duration-300 ease-in-out h-[74%] hover:border-[var(--color-purple2)] border-2 border-[var(--color-purple4)] mb-10 p-[6px] bg-bg3 rounded-md max-w-[200px] text-white font-garamond text-[1.05rem] cursor-pointer">
  <option value="A-Z">A-Z</option>
  <option value="Z-A">Z-A</option>
  <option value="Citadel Hardness">Citadel Hardness</option>
  <option value="Recipe Count">Recipe Count</option>
  <option value="Unique Items"># of Unique Items Needed To Create (Highest-Lowest)</option>
  <option value="Unique Items L-H"># of Unique Items Needed To Create (Lowest-Highest)</option>
</select>
    <div class="mb-4 flex flex-wrap gap-2 justify-center h-[100%]">
      <button v-for="type in Object.keys(props.config.factories).map(id => props.config.factories[id]).filter(f => f !== undefined).map(f => f.type).filter((v, i, a) => a.indexOf(v) === i)" :key="type"
    @click="toggleType(type)"
    :class="[
      'px-3 h-[70%] py-1 rounded-md border font-semibold text-sm transition-all duration-300  ease-in-out',
      hiddenTypes.includes(type) ? 'bg-bg  text-white border-[var(--color-purple4)]' : 'bg-bg3 text-[var(--color-purple2)] border-[var(--color-purple2)]'
    ]"
  >
    {{ type }}
    </button>
</div>
</div>
    <div v-if="filteredFactories.length === 0" class="text-center py-16 text-text3 italic text-[1.1rem]">
      No factories match your search.
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-7.5 mb-10">
      <div
        v-for="factory in filteredFactories"
        :key="factory.id"
        class="FactoryBox bg-linear-to-br from-bg2  to-bg3 border border-border rounded-lg p-[18px_20px] cursor-pointer transition-all duration-180 relative overflow-hidden group hover:border-border2 hover:shadow-[0_8px_32px_rgba(109,40,217,0.22)] hover:-translate-y-0.5"
        :class="{ 'border-purple2 shadow-[0_8px_32px_rgba(109,40,217,0.22)]': selectedFactoryId === factory.id }"
        @click="emit('select', factory.id)"
      >
        <div
          class="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-purple4 via-gold to-purple2 opacity-0 transition-opacity duration-180 group-hover:opacity-100"
          :class="{ 'opacity-100': selectedFactoryId === factory.id }"
        ></div>
        <div class="factoryNameFlex">
        <div class="font-cinzel text-[1.2rem] font-semibold text-white mb-[7px]">{{ factory.name }}</div>

        <span
          class="inline-block text-[0.7rem] font-cinzel tracking-[0.08em] px-[9px] py-[2px] rounded-sm mb-[9px] border" style="max-height:25px;"
          :class="factory.type === 'FCCUPGRADE' ? 'bg-gold/12 text-gold2 border-gold/30' : 'bg-purple/15 text-purple2 border-purple/30'"
        >
          {{ factory.type }}
        </span>
      </div>
        <div class="flex items-center gap-1 flex-wrap mb-[6px]">
          <div v-for="(item, key) in Object.values(factory.setupcost).slice(0, 6)" :key="key">
             <img v-if="getIconUrl(item.type)" :src="getIconUrl(item.type)!" :width="28" :height="28" class="pixelated" />
             <span v-else class="w-7 h-7 flex items-center justify-center bg-purple/10 rounded text-[16px]">{{ getEmoji(item.type) }}</span>
          </div>
        </div>

        <div class="text-[0.9rem] text-text3 mt-[6px]">
          {{ factory.recipes.length }} recipe{{ factory.recipes.length !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
</style>
