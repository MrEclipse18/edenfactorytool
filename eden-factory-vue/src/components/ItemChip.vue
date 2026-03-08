<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ConfigItem } from '../types';
import { getWikiUrl, FB } from '../utils/wikiIcons';
import { getStackSize } from '../utils/stackSizes';

const props = defineProps<{
  item: ConfigItem;
  size?: number;
}>();

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

const stackSize = computed(() => getStackSize(props.item.type));
const fullAmount = computed(() => props.item.is_compacted ? props.item.amount * stackSize.value : props.item.amount);
</script>

<template>
  <div class="bg-bg4 border border-border rounded-lg p-2.5 flex items-center gap-3 min-w-[170px] transition-colors duration-150 hover:border-purple">
    <div class="w-11 h-11 flex-shrink-0 flex items-center justify-center">
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
        ×{{ fullAmount.toLocaleString() }}
        <span v-if="item.is_compacted" class="text-text3 font-normal text-[0.8rem] ml-1">
          ({{ item.amount.toLocaleString() }} stacks)
        </span>
      </div>
      <div v-if="item.display_name" class="text-text3 text-[0.8rem]">{{ item.type }}</div>
    </div>
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
</style>
