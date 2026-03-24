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
  totalFactoryTime,
  totalBreakdown,
} = useWorkstation(props.config);

const items = computed(() => activeWorkstation.value?.items || []);
const hoveredIdX = ref<string | null>(null);
const hoveredId = ref<string | null>(null);

const workstationEntries = computed(() => {
  return items.value
    .map(item => {
      if (item.type === 'factory') {
        const f = props.config.factories[item.id];
        return { ...item, name: f?.name || item.id, icon: null };
      } else {
        const r = props.config.recipes[item.id];
        const output = Object.values(r?.output || {})[0];
        return {
          ...item,
          name: r?.name || item.id,
          icon: output ? getWikiUrl(output.type) : null,
        };
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp);
});

function getIcon(type: string) {
  return getWikiUrl(type);
}

function formatName(type: string, display_name: string | null) {
  if (display_name) return display_name;
  return type
    .split('_')
    .map(w => (w[0] || '').toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getStacks(type: string, amount: number): string {
  const size = getStackSize(type);
  if (size <= 1) return '';
  const stacks = amount / size;
  if (stacks % 1 === 0) return `${stacks} stack${stacks !== 1 ? 's' : ''}`;
  return `${stacks.toFixed(1)} stack${stacks !== 1 ? 's' : ''}`;
}

function downloadFile() {
  const content = workstations.value.find(w => w.id === activeWorkstationId.value);
  if (!content) return;

  const json = JSON.stringify(content, null, 2);
  const blob = new Blob([json], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = content.name + '.edenfactoryworkstation';
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const fileContent = ref<string>('');

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const allowedTypes = ['text/plain', 'application/json'];
  const allowedExtensions = ['.txt', '.edenfactoryworkstation'];

  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (!allowedTypes.includes(file.type) && !hasValidExtension) {
    alert('Only text files are allowed!');
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      alert('Failed to read file as text.');
      return;
    }

    let workstationData: any;

    try {
      workstationData = JSON.parse(reader.result);
      workstationData.id = crypto.randomUUID();
    } catch {
      workstationData = {
        id: crypto.randomUUID(),
        name: reader.result.slice(0, 20) || 'Imported Workstation',
        items: [],
        expandedItems: [],
      };
    }

    if (
      workstationData &&
      typeof workstationData.id === 'string' &&
      typeof workstationData.name === 'string' &&
      Array.isArray(workstationData.items) &&
      Array.isArray(workstationData.expandedItems)
    ) {
      workstations.value.push(workstationData);
      activeWorkstationId.value = workstationData.id;
    } else {
      alert('Invalid workstation file format.');
    }
  };

  reader.onerror = () => {
    console.error('Error reading file:', reader.error);
    alert('Failed to read file!');
  };

  reader.readAsText(file);
}
</script>

<template>
  <div class="relative min-h-[calc(100vh-120px)] pb-10">
    <div class="mb-6 rounded-2xl border border-border2 bg-bg2/80 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          <div class="flex min-w-0 max-w-full gap-3 overflow-x-auto pb-1 pr-2 scrollbar-thin scrollbar-thumb-border2 scrollbar-track-transparent">
            <button
              v-for="w in workstations"
              :key="w.id"
              type="button"
              @mouseover="hoveredId = w.id"
              @mouseleave="hoveredId = null"
              @click="switchWorkstation(w.id)"
              class="group flex h-11 shrink-0 items-center gap-3 rounded-full border px-4 text-sm font-medium tracking-wide transition-all duration-200 ease-out"
              :class="[
                w.id === activeWorkstationId
                  ? 'border-purple-400 bg-purple-500/15 text-white shadow-[0_0_0_1px_rgba(196,181,253,0.18)]'
                  : 'border-border2 bg-bg3/70 text-text3 hover:border-purple-300/50 hover:bg-bg3 hover:text-white',
                hoveredId === w.id ? 'max-w-56' : 'max-w-40',
              ]"
            >
              <span class="min-w-0 truncate text-left">{{ w.name }}</span>

              <div class="flex items-center gap-1">
                <button
                  v-if="hoveredId === w.id"
                  type="button"
                  @click.stop="changeNameWorkstation(w.id)"
                  class="rounded-full p-2 text-text3 transition hover:bg-white/10 hover:text-white"
                  aria-label="Rename workstation"
                  title="Rename"
                >
                  🖊️
                </button>

                <button
                  v-if="workstations.length > 1 && hoveredId === w.id"
                  type="button"
                  @click.stop="deleteWorkstation(w.id)"
                  class="rounded-full p-2 text-text3 transition hover:bg-red/10 hover:text-red"
                  aria-label="Delete workstation"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </button>
          </div>
        </div>
<div class="flex items-center justify-end gap-3">
  <button
    type="button"
    @click="createWorkstation()"
    class="nav-btn flex h-12 w-12 items-center justify-center rounded-full border border-border2 bg-bg3 text-text3 text-2xl font-bold shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-black/20"
    title="New Workstation"
    aria-label="New Workstation"
  >
    +
  </button>
  <label
    class="nav-btn flex h-12 w-12 items-center justify-center rounded-full border border-border2 bg-bg3 text-text3 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-black/20"
    title="Import Workstation"
    aria-label="Import Workstation"
  >
    <img
      class="FlipColor h-6 w-6 object-cover opacity-80"
      src="../../public/import.png"
      alt="Import"
    />
    <input
      type="file"
      accept=".edenfactoryworkstation"
      @change="handleFileUpload"
      class="absolute h-0 w-0 opacity-0"
    />
  </label>
  <button
    type="button"
    @click="downloadFile()"
    class="nav-btn flex h-12 w-12 items-center justify-center rounded-full border border-border2 bg-bg3 text-text3 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-black/20"
    title="Export Workstation"
    aria-label="Export Workstation"
  >
    <img
      class="FlipColor h-6 w-6 object-cover opacity-80"
      src="../../public/export.png"
      alt="Export"
    />
  </button>
</div>
      </div>
    </div>

    <div v-if="activeWorkstationId" class="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div class="flex flex-col gap-6">
        <div class="rounded-2xl border border-border2 bg-bg2/70 p-5 shadow-lg shadow-black/10 backdrop-blur-sm">
          <div class="flex items-center justify-between gap-4 border-b border-border2 pb-4">
            <div>
              <h2 class="font-cinzel text-xl text-gold">Workstation Planner</h2>
              <p class="mt-1 text-[0.72rem] uppercase tracking-[0.22em] text-text3">
                Manage factories, recipes, and their run counts
              </p>
            </div>

            <button
              v-if="items.length > 0"
              type="button"
              @click="clearWorkstation"
              class="cursor-pointer rounded-full border border-red/30 bg-red/10 px-4 py-2 text-sm font-medium text-red transition hover:bg-red/15 hover:shadow-sm"
            >
              Clear All
            </button>
          </div>

          <div v-if="workstationEntries.length === 0" class="py-20 text-center">
            <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-border2 bg-bg3 text-2xl text-text3 shadow-inner">
              X
            </div>
            <p class="text-sm italic text-text3">Your workstation is empty.</p>
            <p class="mt-1 text-xs uppercase tracking-[0.2em] text-text3">
              Add factories or recipes (in other pages) to start planning
            </p>
          </div>

          <div v-else class="mt-5 flex flex-col gap-3">
            <div
              v-for="entry in workstationEntries"
              :key="entry.id + entry.type"
              class="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border2 bg-bg3/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-bg3 hover:shadow-lg hover:shadow-black/10"
              :class="{ 'opacity-50 grayscale-[45%]': !entry.enabled }"
              @mouseover="hoveredIdX = entry.id + '-' + entry.type"
              @mouseleave="hoveredIdX = null"
            >
              <label class="inline-flex items-center">
                <input
                  type="checkbox"
                  :checked="entry.enabled"
                  @change="toggleItem(entry.id, entry.type)"
                  class="h-4 w-4 appearance-none rounded-md bg-purple-200 transition duration-200 ease-in-out checked:bg-purple-600 checked:ring-2 checked:ring-purple-400 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </label>

              <div class="flex h-11 w-11 items-center justify-center rounded-xl border border-border2 bg-bg2 shadow-inner">
                <img v-if="entry.icon" :src="entry.icon" class="h-8 w-8 pixelated" alt="" />
                <span v-else class="text-xs font-cinzel text-text3">
                  {{ (entry as any).type ? (entry as any).type[0].toUpperCase() : '?' }}
                </span>
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate font-semibold text-white">{{ entry.name }}</div>
                <div class="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-text3">
                  {{ entry.type }}
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div v-if="entry.type === 'recipe'" class="mr-10 flex flex-col items-start">
                  <label class="mb-1 text-[0.65rem] font-cinzel uppercase tracking-[0.18em] text-text3">
                    Runs
                  </label>
                  <input
                    type="number"
                    :value="entry.amount"
                    @input="e => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      updateAmount(entry.id, entry.type, isNaN(val) ? 0 : val);
                    }"
                    class="w-24 rounded-xl border border-border2 bg-bg2 px-3 py-2 text-center text-white outline-none transition focus:border-purple2 focus:ring-2 focus:ring-purple-300/30"
                    min="1"
                  />
                </div>

                <button
                  v-if="hoveredIdX === entry.id + '-' + entry.type"
                  type="button"
                  @click="removeItem(entry.id, entry.type)"
                  class="absolute right-2 top-2 rounded-full p-2 text-text3 transition hover:bg-red/10 hover:text-red"
                  aria-label="Remove item"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div class="sticky top-[100px] rounded-2xl border border-border2 bg-bg2/75 p-6 shadow-lg shadow-black/10 backdrop-blur-sm">
          <div class="mb-5">
            <h3 class="font-cinzel text-lg text-gold">Shopping List</h3>
            <p class="mt-1 text-[0.7rem] uppercase tracking-[0.22em] text-text3">
              Base Materials Required
            </p>
          </div>

          <div v-if="!totalBreakdown || totalBreakdown.length === 0" class="rounded-xl border border-dashed border-border2 bg-bg3/50 px-4 py-6 text-sm italic text-text3">
            Enable items to see required materials.
          </div>

          <div v-else class="max-h-[65vh] space-y-2 overflow-y-auto pr-2 custom-scroll">
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

          <div v-if="totalBreakdown && totalBreakdown.length > 0" class="mt-6 space-y-4 border-t border-border pt-4">
            <div class="flex items-center justify-between rounded-xl border border-border2 bg-bg3/70 px-4 py-3">
              <span class="text-[0.72rem] uppercase tracking-[0.2em] text-text3">Total Time</span>
              <span class="font-semibold text-white">{{ totalFactoryTime }} seconds</span>
            </div>

            <p class="text-[0.65rem] leading-tight text-text3 italic">
              Click <strong class="text-purple2">Breakdown</strong> on crafted items (like Steel) to see their ingredients instead.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-border2 bg-bg2/70 p-10 text-center text-text3 shadow-lg shadow-black/10 backdrop-blur-sm">
      Choose or create a workstation to begin.
    </div>

    <p class="absolute bottom-0 left-0 italic text-xs text-text3">
      This feature is new and still in testing! Feel free to leave feedback on the github page
    </p>
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}

.FlipColor {
  filter: brightness(0) invert(1);
}
</style>
