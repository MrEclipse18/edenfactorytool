<script setup lang="ts">
import { computed } from 'vue';
import type { Factory, AppConfig } from '../types';
import { getWikiUrl, FB } from '../utils/wikiIcons';

const props = defineProps<{
  config: AppConfig;
  filter: string;
  selectedFactoryId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
}>();

const filteredFactories = computed(() => {
  const fl = props.filter.toLowerCase();
  return Object.values(props.config.factories).filter(f =>
    !fl || f.name.toLowerCase().includes(fl) || f.id.includes(fl) ||
    f.recipes.some(r => {
      const rec = props.config.recipes[r];
      return rec && rec.name.toLowerCase().includes(fl);
    })
  );
});

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

    <div v-if="filteredFactories.length === 0" class="text-center py-16 text-text3 italic text-[1.1rem]">
      No factories match your search.
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5 mb-10">
      <div
        v-for="factory in filteredFactories"
        :key="factory.id"
        class="bg-linear-to-br from-bg2 to-bg3 border border-border rounded-lg p-[18px_20px] cursor-pointer transition-all duration-180 relative overflow-hidden group hover:border-border2 hover:shadow-[0_8px_32px_rgba(109,40,217,0.22)] hover:-translate-y-0.5"
        :class="{ 'border-purple2 shadow-[0_8px_32px_rgba(109,40,217,0.22)]': selectedFactoryId === factory.id }"
        @click="emit('select', factory.id)"
      >
        <div
          class="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-purple4 via-gold to-purple2 opacity-0 transition-opacity duration-180 group-hover:opacity-100"
          :class="{ 'opacity-100': selectedFactoryId === factory.id }"
        ></div>

        <div class="font-cinzel text-[1rem] font-semibold text-white mb-[7px]">{{ factory.name }}</div>

        <span
          class="inline-block text-[0.7rem] font-cinzel tracking-[0.08em] px-[9px] py-[2px] rounded-sm mb-[9px] border"
          :class="factory.type === 'FCCUPGRADE' ? 'bg-gold/12 text-gold2 border-gold/30' : 'bg-purple/15 text-purple2 border-purple/30'"
        >
          {{ factory.type }}
        </span>

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
