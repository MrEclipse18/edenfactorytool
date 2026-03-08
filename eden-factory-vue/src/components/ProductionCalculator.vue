<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AppConfig, Recipe, Factory } from '../types';
import { getWikiUrl, FB } from '../utils/wikiIcons';
import ItemChip from './ItemChip.vue';

const props = defineProps<{
  config: AppConfig;
}>();

const step = ref(1);
const selectedFactoryId = ref<string | null>(null);
const selectedRecipeId = ref<string | null>(null);
const targetQuantity = ref(64);
const selectedOutputItem = ref('');

const factories = computed(() => {
  return Object.values(props.config.factories).sort((a, b) => a.name.localeCompare(b.name));
});

const factoryRecipes = computed(() => {
  if (!selectedFactoryId.value) return [];
  return (props.config.factories[selectedFactoryId.value]?.recipes || [])
    .map(id => props.config.recipes[id])
    .filter(Boolean);
});

const currentRecipe = computed(() => {
  if (!selectedRecipeId.value) return null;
  return props.config.recipes[selectedRecipeId.value];
});

function selectFactory(id: string) {
  selectedFactoryId.value = id;
  step.value = 2;
}

function selectRecipe(id: string) {
  selectedRecipeId.value = id;
  const r = props.config.recipes[id];
  if (r && Object.values(r.output).length > 0) {
    selectedOutputItem.value = Object.values(r.output)[0].type;
  }
  step.value = 3;
}

const calculationResults = computed(() => {
  if (!currentRecipe.value) return null;
  const outputs = Object.values(currentRecipe.value.output);
  const targetItem = outputs.find(o => o.type === selectedOutputItem.value) || outputs[0];
  if (!targetItem) return null;

  const runs = Math.ceil(targetQuantity.value / targetItem.amount);
  const inputsNeeded = Object.values(currentRecipe.value.input).map(i => ({
    ...i,
    total: i.amount * runs
  }));
  const outputsGained = Object.values(currentRecipe.value.output).map(o => ({
    ...o,
    total: o.amount * runs
  }));

  const totalTimeSeconds = currentRecipe.value.production_time ? parseTimeToSeconds(currentRecipe.value.production_time) * runs : 0;

  return { runs, inputsNeeded, outputsGained, totalTimeSeconds };
});

function parseTimeToSeconds(t: string): number {
  const m = t.match(/^(\d+)([smh])$/);
  if (!m) return 0;
  const v = parseInt(m[1]), u = m[2];
  return u === 's' ? v : u === 'm' ? v * 60 : v * 3600;
}

function fmtSeconds(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

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
  if (!m) return t;
  const v = parseInt(m[1]), u = m[2];
  return u === 's' ? (v === 1 ? '1 second' : `${v} seconds`) :
         u === 'm' ? (v === 1 ? '1 minute' : `${v} minutes`) :
         (v === 1 ? '1 hour' : `${v} hours`);
}

function getIconUrl(type: string) {
  return getWikiUrl(type);
}

function idn(item: any) {
  return item.display_name || item.type.split('_').map((w: string) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}
</script>

<template>
  <div class="max-w-full">
    <!-- Step 1: Pick factory -->
    <div v-if="step === 1">
      <div class="font-cinzel text-[0.95rem] font-semibold text-gold tracking-[0.06em] mb-4 flex items-center gap-4">
        Step 1 — Choose a Factory
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
        <button
          v-for="f in factories"
          :key="f.id"
          class="bg-linear-to-br from-bg2 to-bg3 border border-border rounded-lg p-[14px_16px] cursor-pointer text-left transition-all hover:border-purple2 hover:bg-purple/10 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)]"
          @click="selectFactory(f.id)"
        >
          <div class="font-cinzel text-[0.88rem] font-semibold text-white mb-[3px]">{{ f.name }}</div>
          <div class="text-[0.82rem] text-text3">{{ f.recipes.length }} recipes</div>
        </button>
      </div>
    </div>

    <!-- Step 2: Pick recipe -->
    <div v-if="step === 2">
      <div class="font-cinzel text-[0.95rem] font-semibold text-gold tracking-[0.06em] mb-4 flex items-center gap-4">
        Step 2 — Choose a Recipe
        <button class="bg-transparent border border-border2 text-text3 font-cinzel text-[0.72rem] tracking-[0.05em] py-1 px-3 rounded-sm cursor-pointer transition-all hover:border-purple2 hover:text-purple2" @click="step = 1">
          ← Change Factory
        </button>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
        <button
          v-for="r in factoryRecipes"
          :key="r.id"
          class="bg-bg2 border border-border rounded-lg p-[12px_14px] cursor-pointer text-left transition-all flex items-center gap-3 hover:border-border2 hover:bg-bg3 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(109,40,217,0.15)]"
          @click="selectRecipe(r.id)"
        >
          <div class="flex-shrink-0">
             <img v-if="Object.values(r.output)[0]" :src="getIconUrl(Object.values(r.output)[0].type)!" width="32" height="32" class="pixelated" />
          </div>
          <div class="min-w-0">
            <div class="text-white text-[1rem] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{{ r.name }}</div>
            <div class="text-[0.8rem] text-text3 font-cinzel">{{ tn(r.type) }}{{ r.production_time ? ' · ' + fmt(r.production_time) : '' }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Step 3: Set quantity + results -->
    <div v-if="step === 3 && currentRecipe">
      <div class="font-cinzel text-[0.95rem] font-semibold text-gold tracking-[0.06em] mb-4 flex items-center gap-4">
        Step 3 — Calculate
        <button class="bg-transparent border border-border2 text-text3 font-cinzel text-[0.72rem] tracking-[0.05em] py-1 px-3 rounded-sm cursor-pointer transition-all hover:border-purple2 hover:text-purple2" @click="step = 2">
          ← Change Recipe
        </button>
      </div>

      <div class="bg-linear-to-br from-bg2 to-bg3 border border-border2 rounded-xl p-[28px_32px] relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-purple4 via-gold to-purple2"></div>

        <div class="font-cinzel text-[1.3rem] font-bold bg-linear-to-br from-white to-purple2 bg-clip-text text-transparent mb-1.5">
          {{ currentRecipe.name }}
        </div>
        <div class="text-[0.9rem] text-text2 mb-6 flex gap-3.5 flex-wrap">
          <span><strong class="text-gold">{{ tn(currentRecipe.type) }}</strong></span>
          <span v-if="currentRecipe.production_time">Per run: <strong class="text-gold">{{ fmt(currentRecipe.production_time) }}</strong></span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-start mb-6">
          <div>
            <div class="font-cinzel text-[0.75rem] tracking-[0.1em] text-text3 mb-2.5 uppercase">Inputs</div>
            <div class="flex flex-wrap gap-2.5">
              <ItemChip v-for="i in Object.values(currentRecipe.input)" :key="i.type" :item="i" />
              <span v-if="Object.values(currentRecipe.input).length === 0" class="text-text3 italic">None</span>
            </div>
          </div>
          <div class="flex items-center justify-center sm:pt-9 text-[2rem] text-gold">→</div>
          <div>
            <div class="font-cinzel text-[0.75rem] tracking-[0.1em] text-text3 mb-2.5 uppercase">Output</div>
            <div class="flex flex-wrap gap-2.5">
              <ItemChip v-for="o in Object.values(currentRecipe.output)" :key="o.type" :item="o" />
              <span v-if="Object.values(currentRecipe.output).length === 0" class="text-text3 italic">None</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3.5 flex-wrap py-[18px] border-t border-border mt-2">
          <span class="text-[1.05rem] text-text2">I want</span>
          <input
            v-model.number="targetQuantity"
            type="number"
            min="1"
            class="bg-bg border border-border2 rounded-md text-white font-garamond text-[1.2rem] font-semibold p-[10px_14px] w-[120px] outline-none text-center focus:border-purple2 focus:shadow-[0_0_0_3px_rgba(192,132,232,0.12)]"
          />
          <select
            v-model="selectedOutputItem"
            class="bg-bg border border-border2 rounded-md text-white font-garamond text-[1.05rem] p-[10px_14px] outline-none cursor-pointer"
          >
            <option v-for="o in Object.values(currentRecipe.output)" :key="o.type" :value="o.type">
              {{ idn(o) }}
            </option>
          </select>
        </div>

        <div v-if="calculationResults" class="mt-5">
          <div class="font-cinzel text-[0.75rem] tracking-[0.09em] text-text3 uppercase mb-2.5 border-t border-border pt-3.5">Results</div>
          <div class="flex justify-between items-center py-2 border-b border-border/60 text-[1rem]">
            <span>Runs required</span>
            <span class="text-gold2 font-semibold text-[1.05rem]">{{ calculationResults.runs.toLocaleString() }}</span>
          </div>

          <div class="font-cinzel text-[0.75rem] tracking-[0.09em] text-text3 uppercase mb-2.5 mt-4">You will get</div>
          <div v-for="o in calculationResults.outputsGained" :key="o.type" class="flex justify-between items-center py-2 border-b border-border/60 text-[1rem]">
            <span class="flex items-center gap-2.5 text-text">
              <img v-if="getIconUrl(o.type)" :src="getIconUrl(o.type)!" width="26" height="26" class="pixelated" />
              {{ idn(o) }}
            </span>
            <span>
              <span class="text-gold2 font-semibold text-[1.05rem]">{{ o.total.toLocaleString() }}</span>
              <span class="text-text3 text-[0.84rem] ml-1"> ({{ o.amount }}×{{ calculationResults.runs }})</span>
            </span>
          </div>

          <div class="font-cinzel text-[0.75rem] tracking-[0.09em] text-text3 uppercase mb-2.5 mt-4">Materials needed</div>
          <div v-for="i in calculationResults.inputsNeeded" :key="i.type" class="flex justify-between items-center py-2 border-b border-border/60 text-[1rem]">
            <span class="flex items-center gap-2.5 text-text">
              <img v-if="getIconUrl(i.type)" :src="getIconUrl(i.type)!" width="26" height="26" class="pixelated" />
              {{ idn(i) }}
            </span>
            <span>
              <span class="text-gold2 font-semibold text-[1.05rem]">{{ i.total.toLocaleString() }}</span>
              <span class="text-text3 text-[0.84rem] ml-1"> ({{ i.amount }}×{{ calculationResults.runs }})</span>
            </span>
          </div>

          <div v-if="calculationResults.totalTimeSeconds > 0" class="mt-3.5 text-text3 text-[0.9rem] italic">
            ⏱ Total time: ~{{ fmtSeconds(calculationResults.totalTimeSeconds) }} ({{ calculationResults.runs }} runs × {{ fmt(currentRecipe.production_time) }} each)
          </div>
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
