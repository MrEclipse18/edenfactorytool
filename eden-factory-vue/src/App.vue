<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { parseConfig } from './utils/yamlParser';
import type { AppConfig, Factory } from './types';
import FactoryGrid from './components/FactoryGrid.vue';
import RecipeExplorer from './components/RecipeExplorer.vue';
import ProductionCalculator from './components/ProductionCalculator.vue';
import ItemChip from './components/ItemChip.vue';

const config = ref<AppConfig | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activePanel = ref('factories');
const globalSearch = ref('');
const selectedFactoryId = ref<string | null>(null);

onMounted(async () => {
  try {
    console.log('Fetching configuration...');
    const response = await fetch('/factorymodconfig.yml');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${response.statusText} (Tried to fetch /factorymodconfig.yml)`);
    }
    const yamlText = await response.text();
    console.log('Parsing configuration...');
    config.value = parseConfig(yamlText);
    console.log('Configuration loaded successfully.');
  } catch (e: any) {
    console.error('Failed to load configuration:', e);
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
});

const selectedFactory = computed(() => {
  if (!config.value || !selectedFactoryId.value) return null;
  return config.value.factories[selectedFactoryId.value];
});

function selectFactory(id: string) {
  selectedFactoryId.value = id;
  const el = document.getElementById('factory-detail');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeFactoryDetail() {
  selectedFactoryId.value = null;
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
</script>

<template>
  <div class="min-h-screen">
    <header class="bg-linear-to-b from-[rgba(8,7,18,0.98)] to-[rgba(12,11,20,0.95)] border-b border-border2 p-[20px_28px_16px] sticky top-0 z-[100] backdrop-blur-md shadow-[0_2px_32px_rgba(109,40,217,0.18)]">
      <div class="max-w-[1440px] mx-auto flex items-center gap-5 flex-wrap">
        <div class="logo">
          EdenMC <span class="font-cinzel text-[0.7rem] font-normal tracking-[0.22em] uppercase text-text3 ml-2.5 text-fill-initial bg-none">Factories</span>
        </div>
        <div class="flex-1 min-w-[200px] max-w-[440px] relative">
          <span class="absolute left-[13px] top-1/2 -translate-y-1/2 text-text3 text-[1rem] pointer-events-none">⌕</span>
          <input
            v-model="globalSearch"
            type="text"
            placeholder="Search factories, recipes, items…"
            class="w-full bg-bg3 border border-border2 rounded-lg text-white font-garamond text-[1.05rem] p-[9px_16px_9px_42px] outline-none transition-all focus:border-purple2 focus:shadow-[0_0_0_3px_rgba(192,132,232,0.12)] placeholder:text-text3"
          />
        </div>
        <nav class="flex gap-1 flex-wrap">
          <button
            class="nav-btn"
            :class="{ 'active': activePanel === 'factories' }"
            @click="activePanel = 'factories'"
          >
            Factories
          </button>
          <button
            class="nav-btn"
            :class="{ 'active': activePanel === 'recipes' }"
            @click="activePanel = 'recipes'"
          >
            Recipes
          </button>
          <button
            class="nav-btn"
            :class="{ 'active': activePanel === 'calculator' }"
            @click="activePanel = 'calculator'"
          >
            Calculator
          </button>
        </nav>
      </div>
    </header>

    <main class="max-w-[1440px] mx-auto p-[28px_24px_80px] relative z-10">
      <div v-if="loading" class="text-center py-24 text-text2 italic text-[1.2rem]">
        <div class="w-[38px] h-[38px] border-3 border-border2 border-t-purple2 rounded-full animate-spin mx-auto mb-[18px]"></div>
        Loading configuration…
      </div>

      <div v-else-if="error" class="bg-[rgba(60,10,10,0.6)] border border-red rounded-xl p-[24px_28px] mx-auto max-w-[640px] text-[#f0a0a8] text-[1.05rem]">
        <strong class="text-red font-cinzel block mb-2 text-[1rem]">⚠ Could not load configuration</strong>
        Make sure <code class="bg-black/40 px-1.5 py-0.5 rounded text-[0.9em]">factorymodconfig.yml</code> is in the public directory.
        <br /><br />
        <span>{{ error }}</span>
      </div>

      <div v-else-if="config">
        <!-- FACTORIES PANEL -->
        <div v-if="activePanel === 'factories'">
          <!-- Factory Detail -->
          <div
            v-if="selectedFactory"
            id="factory-detail"
            class="bg-linear-to-br from-bg2 to-bg3 border border-border2 rounded-xl p-[30px_36px] mb-9 shadow-[0_4px_40px_rgba(109,40,217,0.15)] relative overflow-hidden"
          >
            <div class="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-purple4 via-purple2 via-gold via-purple2 to-purple4"></div>
            <div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div>
                <div class="font-cinzel text-[1.7rem] font-extrabold bg-linear-to-br from-white to-purple2 bg-clip-text text-transparent">
                  {{ selectedFactory.name }}
                </div>
                <div class="text-text3 italic mt-1 text-[0.95rem]">Factory ID: {{ selectedFactory.id }}</div>
              </div>
              <button
                class="bg-bg4 border border-border2 text-text2 text-[1.2rem] w-[38px] h-[38px] rounded-lg cursor-pointer flex items-center justify-center transition-all hover:border-purple2 hover:text-purple2 hover:shadow-[0_0_8px_var(--glow)]"
                @click="closeFactoryDetail"
              >
                ✕
              </button>
            </div>

            <div class="flex gap-3 flex-wrap mb-6">
              <div class="bg-bg4 border border-border2 rounded-lg p-[10px_16px]">
                <div class="text-text3 text-[0.78rem] uppercase tracking-[0.07em] mb-0.5 font-cinzel">Type</div>
                <div class="text-gold2 font-semibold text-[1.05rem]">{{ selectedFactory.type }}</div>
              </div>
              <div v-if="selectedFactory.citadelBreakReduction" class="bg-bg4 border border-border2 rounded-lg p-[10px_16px]">
                <div class="text-text3 text-[0.78rem] uppercase tracking-[0.07em] mb-0.5 font-cinzel">Citadel Hardness</div>
                <div class="text-gold2 font-semibold text-[1.05rem]">{{ selectedFactory.citadelBreakReduction }}×</div>
              </div>
              <div class="bg-bg4 border border-border2 rounded-lg p-[10px_16px]">
                <div class="text-text3 text-[0.78rem] uppercase tracking-[0.07em] mb-0.5 font-cinzel">Recipes</div>
                <div class="text-gold2 font-semibold text-[1.05rem]">{{ selectedFactory.recipes.length }}</div>
              </div>
            </div>

            <div v-if="Object.keys(selectedFactory.setupcost).length > 0">
              <div class="section-title">Setup Cost</div>
              <div class="flex flex-wrap gap-2.5 mb-7">
                <ItemChip v-for="item in Object.values(selectedFactory.setupcost)" :key="item.type" :item="item" />
              </div>
            </div>

            <div v-if="selectedFactory.fuel">
              <div class="section-title">Fuel</div>
              <div class="flex flex-wrap gap-2.5 mb-7">
                <ItemChip :item="selectedFactory.fuel" />
              </div>
            </div>

            <hr class="border-none border-t border-border my-6" />

            <div class="section-title">
              Recipes <span class="text-text3 font-normal text-[0.9rem] font-garamond tracking-normal ml-2">({{ selectedFactory.recipes.length }})</span>
            </div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-2.5">
              <div
                v-for="rid in selectedFactory.recipes"
                :key="rid"
                class="bg-bg4 border border-border rounded-lg p-[12px_16px] cursor-pointer transition-all duration-150 hover:border-purple2 hover:bg-purple/10 hover:shadow-[0_2px_12px_var(--glow)]"
                @click="activePanel = 'recipes'; globalSearch = rid"
              >
                <template v-if="config.recipes[rid]">
                  <div class="text-[1rem] text-white mb-[3px]">{{ config.recipes[rid].name }}</div>
                  <div class="text-[0.82rem] text-text3 font-cinzel tracking-[0.03em]">
                    {{ tn(config.recipes[rid].type) }}{{ config.recipes[rid].production_time ? ' · ' + fmt(config.recipes[rid].production_time) : '' }}
                  </div>
                </template>
                <div v-else class="opacity-40 text-white">{{ rid }}</div>
              </div>
            </div>
          </div>

          <FactoryGrid
            :config="config"
            :filter="globalSearch"
            :selected-factory-id="selectedFactoryId"
            @select="selectFactory"
          />
        </div>

        <!-- RECIPES PANEL -->
        <div v-if="activePanel === 'recipes'">
          <RecipeExplorer :config="config" :initial-search="globalSearch" />
        </div>

        <!-- CALCULATOR PANEL -->
        <div v-if="activePanel === 'calculator'">
          <ProductionCalculator :config="config" />
        </div>
      </div>
    </main>
  </div>
</template>
