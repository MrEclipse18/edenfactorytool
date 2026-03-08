<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { AppConfig, Recipe } from '../types';
import { getWikiUrl } from '../utils/wikiIcons';
import ItemChip from './ItemChip.vue';

const props = defineProps<{
  config: AppConfig;
  search: string;
}>();

const emit = defineEmits<{
  (e: 'update:search', val: string): void;
}>();

const selectedFactoryId = ref('');
const selectedRecipeId = ref<string | null>(null);

watch(selectedFactoryId, (newVal) => {
  if (newVal !== null) {
    emit('update:search', ''); // Clear global search when factory changes
  }
});

const recipesByFactory = computed(() => {
  if (selectedFactoryId.value) {
    return props.config.factories[selectedFactoryId.value]?.recipes || [];
  }
  return Object.keys(props.config.recipes);
});

const filteredRecipes = computed(() => {
  const fl = props.search.toLowerCase();
  return recipesByFactory.value
    .map(id => props.config.recipes[id])
    .filter((r): r is Recipe => {
      if (!r) return false;
      if (!fl) return true;
      return r.name.toLowerCase().includes(fl) || r.id.toLowerCase().includes(fl);
    });
});

const selectedRecipe = computed(() => {
  if (!selectedRecipeId.value) return filteredRecipes.value[0] || null;
  return props.config.recipes[selectedRecipeId.value] || filteredRecipes.value[0] || null;
});

const factories = computed(() => {
  return Object.values(props.config.factories).sort((a, b) => a.name.localeCompare(b.name));
});

const recipeFactories = computed(() => {
  if (!selectedRecipe.value) return [];
  return Object.values(props.config.factories).filter(f => 
    f.recipes.includes(selectedRecipe.value!.id)
  );
});

function tn(t: string) {
  return ({
    PRODUCTION: 'Production', REPAIR: 'Repair', UPGRADE: 'Upgrade',
    RANDOM: 'Random', PRINTINGPLATE: 'Printing', PRINTBOOK: 'Print',
    WORDBANK: 'Wordbank', PRINTNOTE: 'Print Note', FCCUPGRADE: 'Upgrade'
  } as any)[t] || t || 'Other';
}

function fmt(t: string | null) {
  if (!t) return null;
  const m = t.match(/^(\d+)([smh])$/);
  if (!m || !m[1]) return t;
  const v = parseInt(m[1]), u = m[2];
  return u === 's' ? (v === 1 ? '1 second' : `${v} seconds`) :
         u === 'm' ? (v === 1 ? '1 minute' : `${v} minutes`) :
         (v === 1 ? '1 hour' : `${v} hours`);
}

function getIconUrl(type: string) {
  return getWikiUrl(type);
}

function getRecipeFactoryNames(recipeId: string): string {
  const matchingFactories = Object.values(props.config.factories)
    .filter(f => f.recipes.includes(recipeId))
    .map(f => f.name);
  
  if (matchingFactories.length === 0) return 'Unknown Factory';
  if (matchingFactories.length > 2) return `${matchingFactories[0]} +${matchingFactories.length - 1} more`;
  return matchingFactories.join(', ');
}

function selectRecipe(rid: string) {
  selectedRecipeId.value = rid;
  emit('update:search', ''); // Clear global search when recipe is clicked
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5 min-h-[70vh]">
    <div class="flex flex-col gap-2.5">
      <div class="flex flex-col gap-2 mb-4">
        <select
          v-model="selectedFactoryId"
          class="bg-bg2 border border-border2 rounded-md text-white font-garamond text-[1.05rem] p-[8px_13px] outline-none cursor-pointer focus:border-purple2"
        >
          <option value="">All Factories</option>
          <option v-for="f in factories" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
        <div class="text-text3 text-sm">{{ filteredRecipes.length }} recipe{{ filteredRecipes.length !== 1 ? 's' : '' }}</div>
      </div>

      <div class="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] flex flex-col gap-1.5 pr-1">
        <div
          v-for="r in filteredRecipes"
          :key="r.id"
          class="bg-bg2 border border-border rounded-lg p-3 cursor-pointer transition-all duration-150 flex items-center gap-2.5 hover:border-border2 hover:bg-bg3"
          :class="{ 'border-purple2 bg-purple/12': selectedRecipeId === r.id }"
          @click="selectRecipe(r.id)"
        >
          <div class="flex-shrink-0">
            <img v-if="Object.values(r.output)[0]" :src="getIconUrl((Object.values(r.output)[0] as any).type)!" width="28" height="28" class="pixelated" />
          </div>
          <div class="min-w-0">
            <div class="text-white text-[1rem] whitespace-nowrap overflow-hidden text-ellipsis">{{ r.name }}</div>
            <div class="text-text3 text-[0.8rem] font-cinzel tracking-[0.03em] whitespace-nowrap overflow-hidden text-ellipsis">
              {{ getRecipeFactoryNames(r.id) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedRecipe" class="bg-linear-to-br from-bg2 to-bg3 border border-border rounded-xl p-[28px_32px] sticky top-[100px] self-start">
      <div class="font-cinzel text-[1.5rem] font-bold bg-linear-to-br from-white to-purple2 bg-clip-text text-transparent mb-1.5">
        {{ selectedRecipe.name }}
      </div>
      <div v-if="recipeFactories.length > 0" class="flex flex-wrap gap-2 mb-3">
        <span v-for="f in recipeFactories" :key="f.id" class="text-[0.75rem] font-cinzel bg-bg4 border border-border2 text-text2 px-2 py-0.5 rounded">
          {{ f.name }}
        </span>
      </div>
      <div class="text-[0.93rem] text-text2 mb-[22px] flex gap-4 flex-wrap">
        <span><strong class="text-gold">{{ tn(selectedRecipe.type) }}</strong></span>
        <span v-if="selectedRecipe.production_time">Time: <strong class="text-gold">{{ fmt(selectedRecipe.production_time) }}</strong></span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-start mb-7">
        <div>
          <div class="font-cinzel text-[0.76rem] tracking-[0.1em] text-text3 mb-3 uppercase">Inputs</div>
          <div class="flex flex-wrap gap-2.5">
            <ItemChip v-for="i in Object.values(selectedRecipe.input)" :key="(i as any).type" :item="(i as any)" />
            <span v-if="Object.values(selectedRecipe.input).length === 0" class="text-text3 italic text-[0.95rem]">None</span>
          </div>
        </div>
        <div class="flex items-center justify-center sm:pt-10 text-[2rem] text-gold filter drop-shadow-[0_0_8px_var(--glow2)]">
          →
        </div>
        <div>
          <div class="font-cinzel text-[0.76rem] tracking-[0.1em] text-text3 mb-3 uppercase">Output</div>
          <div class="flex flex-wrap gap-2.5">
            <ItemChip v-for="(o, key) in selectedRecipe.output" :key="key" :item="(o as any)" />
            <span v-if="Object.values(selectedRecipe.output).length === 0" class="text-text3 italic text-[0.95rem]">None</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-text3 italic text-[1.1rem] text-center py-16">
      ← Select a recipe to see details
    </div>
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
</style>
