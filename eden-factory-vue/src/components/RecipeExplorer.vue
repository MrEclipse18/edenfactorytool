<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue';
import type { AppConfig, Recipe } from '../types';
import { getWikiUrl } from '../utils/wikiIcons';
import { useWorkstation } from '../utils/workstation';
import ItemChip from './ItemChip.vue';

const workstationBtnRef = ref<HTMLElement | null>(null);

  const props = defineProps<{
  config: AppConfig;
  search: string;
  recipeSearch: string | null;
  activePanel: string;
}>();

const { 
  activeWorkstation,
  workstations,
  activeWorkstationId,
  deleteWorkstation,
  removeItem, 
  toggleItem, 
  switchWorkstation,
  createWorkstation,
  updateAmount, 
  toggleExpand,
  clearWorkstation, 
  changeNameWorkstation,
  totalBreakdown 
} = useWorkstation(props.config);

function flashWorkstationButton() { 
  if (!workstationBtnRef.value) return;
  workstationBtnRef.value.classList.add('animate-pulse');
  setTimeout(() => {
    workstationBtnRef.value?.classList.remove('animate-pulse');
  }, 1700);
}


const emit = defineEmits<{
  (e: 'update:search', val: string): void;
  (e: 'update:activePanel', val: string): void;
}>();

const hiddenTypes = ref<string[]>([]);
const selectedFactoryId = ref('');
const selectedRecipeId = ref<string | null>(null);

const recipesByFactory = computed(() => {
  if (selectedFactoryId.value) {
    return props.config.factories[selectedFactoryId.value]?.recipes || [];
  }
  return Object.keys(props.config.recipes);
});

const PINNED_STORAGE_KEY = 'eden_pinned_recipes';
const pinnedRecipeIds = ref<string[]>([]);

const savedPins = localStorage.getItem(PINNED_STORAGE_KEY);
if (savedPins) {
  try {
    pinnedRecipeIds.value = JSON.parse(savedPins);
  } catch (e) {
    console.error('Failed to load pinned recipes:', e);
  }
}

watch(pinnedRecipeIds, (newVal) => {
  localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(newVal));
}, { deep: true });

const filteredRecipes = computed(() => {
  const fl = props.search.toLowerCase();
  const allowed = ['PRODUCTION','REPAIR','UPGRADE','RANDOM'];

  return recipesByFactory.value
    .map(id => props.config.recipes[id])
    .filter((r): r is Recipe => {
      if (!r) return false;

      const type = allowed.includes(r.type) ? r.type : 'MISC';
      if (hiddenTypes.value.includes(type)) return false;
      if (!fl) return true;
      
      if(props.recipeSearch == "All") {
        return r.name.toLowerCase().includes(fl) || 
               Object.values(r.input).some(i => i.type?.toLowerCase().includes(fl)) || 
               Object.values(r.output).some(i => i.type?.toLowerCase().includes(fl)) ||
               r.id.toLowerCase().includes(fl);
      } else if(props.recipeSearch =="Input") {
        return Object.values(r.input).some(i => i.type?.toLowerCase().includes(fl));
      } else if(props.recipeSearch == "Output") {
        return Object.values(r.output).some(i => i.type?.toLowerCase().includes(fl));
      } else if(props.recipeSearch =="Name") {
        return r.name.toLowerCase().includes(fl) || r.id.toLowerCase().includes(fl);
      } else {
        return r.name.toLowerCase().includes(fl);
      }
    });
});

const pinnedRecipes = computed(() => {
  return pinnedRecipeIds.value
    .map(id => props.config.recipes[id])
    .filter((r): r is Recipe => !!r);
});

const selectedRecipe = computed(() => {
  if (!selectedRecipeId.value) return pinnedRecipes.value[0] || filteredRecipes.value[0] || null;
  return props.config.recipes[selectedRecipeId.value] || null;
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
function toggleType(type: string) {
  if (hiddenTypes.value.includes(type)) {
    hiddenTypes.value = hiddenTypes.value.filter(t => t !== type);
  } else {
    hiddenTypes.value.push(type);
  }
}
function selectRecipe(rid: string) {
  selectedRecipeId.value = rid;
  // emit('update:search', ''); 
  
  if(window.matchMedia("only screen and (max-width: 768px)").matches) {
    nextTick(() => {
      const el = document.getElementById('selectedRecipePanel');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

const { addItem } = useWorkstation(null);

function handleWorkstationToggle(workstationId: string, id: string, type: 'factory' | 'recipe') {
  if (isInWorkstation(id, type, workstationId)) {
    removeItem(id, type, workstationId);
  } else {
    addItem(id, type, 1, workstationId);
  }
}

function isInWorkstation(id: string, type: 'factory' | 'recipe', workstationId?: string) {
  const targetWorkstation = workstationId
    ? workstations.value.find(w => w.id === workstationId)
    : activeWorkstation.value;

  if (!targetWorkstation) return false;
  return targetWorkstation.items.some(i => i.id === id && i.type === type);
}
let showWorkstations = ref(false);
function togglePinRecipe() {
  if (!selectedRecipe.value) return;

  const id = selectedRecipe.value.id;

  if (pinnedRecipeIds.value.includes(id)) {
    pinnedRecipeIds.value = pinnedRecipeIds.value.filter(r => r !== id);
  } else {
    pinnedRecipeIds.value.push(id);
  }
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
<div class="flex gap-2 mb-4 flex-wrap">
  <button
    v-for="type in ['PRODUCTION','REPAIR','UPGRADE','RANDOM','MISC']"
    :key="type"
    @click="toggleType(type)"
    :class="hiddenTypes.includes(type)
      ? 'bg-bg3 text-text3 border border-border2 hover:bg-bg4 hover:text-white'
      : 'bg-bg4 text-white border border-purple2 hover-purple2'"
    class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md"
  >
    {{ tn(type) }}
  </button>
</div>
      <div class="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] flex flex-col gap-1.5 pr-1 custom-scroll">
        
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

    <div class="flex-col flex gap-1.3">
      <div class="flex">
        <div class="flex flex-col w-full">
          <div id="selectedRecipePanel" v-if="selectedRecipe" class="w-full bg-linear-to-br from-bg2 to-bg3 border border-border rounded-xl p-[28px_32px] top-[100px] mb-4 self-start">
            <div class="flex justify-between">
              <div class="font-cinzel text-[1.5rem] font-bold bg-linear-to-br from-white to-purple2 bg-clip-text text-transparent mb-1.5">
                {{ selectedRecipe.name }}
              </div>
<div class="flex gap-2 justify-end items-center relative flex-wrap">
<div class="relative">
  <button
    class="nav-btn text-sm cursor-pointer px-4 py-2 min-h-10 rounded-lg bg-bg1 hover:bg-bg2 transition-colors flex items-center"
    @mouseenter="showWorkstations = true"
    @mouseleave="showWorkstations = false"
  >
    Workstations
    <svg
      class="inline-block w-3 h-3 ml-1 transition-transform duration-200"
      :class="{ 'rotate-180': showWorkstations }"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.292l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0l-4.25-4.65a.75.75 0 01.02-1.06z"
      />
    </svg>
  </button>

  <transition name="fade">
    <div
      v-show="showWorkstations"
      class="absolute left-0 mt-2 w-72 overflow-hidden rounded-2xl border border-border/80 bg-bg2 shadow-2xl ring-1 ring-black/5 z-50"
      @mouseenter="showWorkstations = true"
      @mouseleave="showWorkstations = false"
    >
      <div class="px-4 py-3 border-b border-border/70 bg-bg1/60">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-text/60">
          Workstations
        </p>
        <p class="mt-1 text-[11px] text-text/45">
          Click to add or remove this recipe
        </p>
      </div>

      <div class="max-h-64 overflow-y-auto p-2">
        <button
          v-for="w in workstations"
          :key="w.id"
          @click="handleWorkstationToggle(w.id, selectedRecipe.id, 'recipe')"
          class="group w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl border transition-all duration-150 ease-out text-left"
          :class="isInWorkstation(selectedRecipe.id, 'recipe', w.id)
            ? 'bg-primary/12 border-primary/35 text-primary shadow-sm'
            : 'bg-bg1/40 border-transparent text-text/80 hover:bg-bg3 hover:border-border/70 hover:text-text'"
        >
          <span
            class="shrink-0 grid place-items-center w-8 h-8 rounded-lg font-semibold text-sm transition-colors"
            :class="isInWorkstation(selectedRecipe.id, 'recipe', w.id)
              ? 'bg-primary text-white'
              : 'bg-bg3 text-text/55 group-hover:bg-bg4 group-hover:text-text/75'"
          >
            {{ isInWorkstation(selectedRecipe.id, 'recipe', w.id) ? '✓' : '+' }}
          </span>

          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ w.name }}
          </span>

          <span
            class="shrink-0 text-[11px] font-medium px-2 py-1 rounded-full transition-colors"
            :class="isInWorkstation(selectedRecipe.id, 'recipe', w.id)
              ? 'bg-primary/15 text-primary'
              : 'bg-bg3 text-text/45 group-hover:bg-bg4 group-hover:text-text/60'"
          >
            {{ isInWorkstation(selectedRecipe.id, 'recipe', w.id) ? 'Added' : 'Add' }}
          </span>
        </button>
      </div>
    </div>
  </transition>
</div>

  <button
    class="nav-btn text-sm cursor-pointer px-4 py-2 min-h-10 rounded-lg bg-bg1 hover:bg-bg2 transition-colors flex items-center"
    @click="togglePinRecipe"
  >
    {{ pinnedRecipeIds.includes(selectedRecipe.id) ? '❌ Unpin' : '📌 Pin' }}
  </button>
</div>
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
                  <span
                    v-for="i in Object.values(selectedRecipe.input)"
                    :key="i.type"
                    class="inline-block cursor-pointer"
                    @click="emit('update:search', i.type!)"
                  >
                    <ItemChip :item="i" />
                  </span>
                  <span v-if="Object.values(selectedRecipe.input).length === 0" class="text-text3 italic text-[0.95rem]">None</span>
                </div>
              </div>
              <div class="flex items-center justify-center sm:pt-10 text-[2rem] text-gold filter drop-shadow-[0_0_8px_var(--glow2)]">
                →
              </div>
              <div>
                <div class="font-cinzel text-[0.76rem] tracking-[0.1em] text-text3 mb-3 uppercase">Output</div>
                <div class="flex flex-wrap gap-2.5">
                  <span
                    v-for="o in Object.values(selectedRecipe.output)"
                    :key="o.type"
                    class="inline-block cursor-pointer"
                    @click="emit('update:search', o.type!)"
                  >
                    <ItemChip :item="o" />
                  </span>
                  <span v-if="Object.values(selectedRecipe.output).length === 0" class="text-text3 italic text-[0.95rem]">None</span>
                </div>
              </div>
            </div>
            <div class="self-end">
              <button v-if="selectedRecipe"
                class="nav-btn min-w-5 min-h-12 text-[1rem] cursor-pointer"
                @click="emit('update:activePanel', 'calculator'); emit('update:search', selectedRecipe.id);"
              >
                Calculate
              </button>
            </div>
          </div>
          <div v-else class="text-text3 italic text-[1.1rem] text-center py-16">
            ← Select a recipe to see details
          </div>

          <div v-if="pinnedRecipes.length > 0" class="flex flex-col gap-4 mt-2">
            <div
              v-for="p in pinnedRecipes"
              :key="p?.id"
              class="w-full bg-linear-to-br from-bg2 to-bg3 border border-purple2 rounded-xl p-[24px] opacity-90"
            >
              <div class="flex justify-between items-center mb-2">
                <div class="font-cinzel text-[1.2rem] font-bold text-purple2">
                  📌 {{ p?.name }}
                </div>

                <button
                  class="text-sm text-red-400 hover:text-red-300 cursor-pointer"
                  @click="pinnedRecipeIds = pinnedRecipeIds.filter(id => id !== p?.id)"
                >
                  Remove
                </button>
              </div>

              <div class="text-[0.85rem] text-text2 mb-3 flex gap-4 flex-wrap">
                <span><strong class="text-gold">{{ tn(p!.type) }}</strong></span>
                <span v-if="p!.production_time">
                  Time: <strong class="text-gold">{{ fmt(p!.production_time) }}</strong>
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                <div>
                  <div class="text-[0.7rem] text-text3 mb-2 uppercase">Inputs</div>
                  <div class="flex flex-wrap gap-2.5">
                    <ItemChip
                      v-for="i in Object.values(p!.input)"
                      :key="i.type"
                      :item="i"
                      class="cursor-pointer"
                      @click="emit('update:search', i.type!)"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-center text-[1.5rem] text-gold">
                  →
                </div>

                <div>
                  <div class="text-[0.7rem] text-text3 mb-2 uppercase">Output</div>
                  <div class="flex flex-wrap gap-2.5">
                    <ItemChip
                      v-for="o in Object.values(p!.output)"
                      :key="o.type"
                      :item="o"
                      class="cursor-pointer"
                      @click="emit('update:search', o.type!)"
                    />
                  </div>
                </div>
              </div>
            </div>
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
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}


</style>
