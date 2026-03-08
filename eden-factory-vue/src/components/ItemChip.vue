<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ConfigItem } from '../types';
import { getWikiUrl, FB } from '../utils/wikiIcons';

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
      <div class="text-white text-[1.05rem] leading-tight">{{ displayName }}</div>
      <div class="text-gold font-semibold text-[1rem]">×{{ item.amount.toLocaleString() }}</div>
      <div v-if="item.display_name" class="text-text3 text-[0.8rem]">{{ item.type }}</div>
    </div>
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
</style>
