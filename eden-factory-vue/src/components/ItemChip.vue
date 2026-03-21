<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ConfigItem } from '../types';
import { getWikiUrl, FB } from '../utils/wikiIcons';
import { getStackSize } from '../utils/stackSizes';



const props = defineProps<{
  item: ConfigItem;
  size?: number;
  
}>();
const emit = defineEmits<{
  (e: 'update:search', val: string): void;
    (e: 'select', val: string): void;

}>();

const enchants = computed(() => {
  const meta = props.item.meta;
  if (!meta) return [];
  const ench = (meta as any).enchants;
  if (!ench || typeof ench !== 'object') return [];
  return Object.entries(ench).map(([name, level]) => `${name} ${level}`);
});


const lore = computed(() => {
  const raw = props.item.meta?.lore ?? '';
  const lines = typeof raw === 'string' ? raw.split('\n') : raw;
  return Array.isArray(lines) ? lines.filter(line => line.trim() !== '') : [];
});
const imgSize = props.size || 40;
const wikiUrl = computed(() => getWikiUrl(props.item.type));
const imgError = ref(false);

const displayName = computed(() => {
  if (props.item.display_name) return props.item.display_name;
  return props.item.type.split('_').map(w => (w[0] ? w[0].toUpperCase() : '') + w.slice(1).toLowerCase()).join(' ');
});

const fallbackEmoji = computed(() => FB[props.item.type] || '❓');
const formatChance = (c: number) => {
  const p = c * 100;
  return p >= 1 ? p.toFixed(1) : p.toPrecision(2);
};
const borderClass = computed(() => {
  if (hovered.value) return 'border-purple';
  return lore.value.length > 0 ? 'border-border2 border-1' : 'border-border border ';
});
let hovered = ref(false);
const stackSize = computed(() => getStackSize(props.item.type));
const fullAmount = computed(() => props.item.is_compacted ? props.item.amount * stackSize.value : props.item.amount);


</script>

<template>
  <div
  @mouseover="hovered = true"
  @mouseleave="hovered = false"
  :class="[
    ' bg-bg4 cursor-pointer relative border rounded-lg p-2.5 flex items-center gap-3 min-w-[170px] h-[90px] transition-all duration-150',
    borderClass
  ]"
>
    <div class="w-11 h-11 flex-shrink-0 transition-all duration-300 flex items-center justify-center">
      <img
        v-if="wikiUrl && !imgError"
        :src="wikiUrl"
        :width="imgSize"
        :height="imgSize"
        :alt="item.type"
        class="pixelated"
        @error="imgError = true"
      />
      <span
        v-else
        class="inline-flex items-center justify-center bg-purple/10 rounded-md"
        :style="{ width: imgSize + 'px', height: imgSize + 'px', fontSize: Math.round(imgSize * 0.65) + 'px' }"
        :title="'Missing icon: ' + item.type"
      >
        {{ fallbackEmoji }}
      </span>
    </div>
    <div class="item-info">
      <div class="text-white text-[1.05rem] leading-tight flex items-center gap-2">
        {{ displayName }}
        <span v-if="item.is_compacted" class="text-[0.65rem] bg-gold/20 text-gold px-1.5 py-0.5 rounded border border-gold/30 font-cinzel uppercase tracking-tighter">
          Compacted
        </span>
        <span v-if="item.chance !== undefined" class="text-[0.7rem] bg-purple/20 text-purple2 px-1.5 py-0.5 rounded border border-purple/30 font-cinzel">
          {{ formatChance(item.chance) }}%
        </span>
      </div>
      <div class="text-gold font-semibold text-[1rem]">
        ×{{ item.amount.toLocaleString() }}
        <span v-if="item.is_compacted" class="text-text3 font-normal text-[0.8rem] ml-1">
          ({{ fullAmount.toLocaleString() }} total)
        </span>
      </div>
      <div v-if="item.display_name" class="text-text3 text-[0.8rem]">{{ item.type }}</div>
      <div class="absolute left-0 bottom-[calc(100%+10px)] flex flex-col gap-1">
<div v-if="hovered && (lore.length)"
     class=" left-0 rounded-md border border-border2 bg-bg2 p-2 text-text3 text-[0.75rem] italic z-50"
     :style="{  }">
  <div v-for="line in lore" :key="'lore-' + line">{{ line }}</div>
</div>
<div v-if="hovered && (enchants.length)"
     class=" left-0 rounded-md border w-full border-border2 bg-bg2 p-2 text-text3 text-[0.75rem] italic z-50"
     :style="{  }">
  <div v-if="enchants.length > 0" class="mt-1">
    <div v-for="line in enchants" :key="'ench-' + line">{{ line }}</div>
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
