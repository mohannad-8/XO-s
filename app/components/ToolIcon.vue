<script setup lang="ts">
import type { Mark, ToolType } from '~~/shared/types/game'

const props = defineProps<{ tool: ToolType; mark: Mark }>()

// رسوم الأدوات على شبكة 48: خطوط ثخينة للموضوع، خطوط أخف للتفاصيل
const mini = (x: number, y: number, r: number) =>
  props.mark === 'X' ? `M${x - r} ${y - r}l${2 * r} ${2 * r}M${x + r} ${y - r}l${-2 * r} ${2 * r}` : null
</script>

<template>
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <template v-if="tool === 'square'">
      <path v-if="mark === 'X'" :d="mini(20, 28, 8)!" stroke-width="4.4" />
      <circle v-else cx="20" cy="28" r="9" stroke-width="4.4" />
      <text x="37.5" y="18" text-anchor="middle">2</text>
    </template>
    <template v-else-if="tool === 'out'">
      <path d="M26.5 17v28M35.5 17v28M17 26.5h28M17 35.5h28" stroke-width="2.6" />
      <path v-if="mark === 'X'" :d="mini(9.5, 9.5, 4.5)!" stroke-width="3.8" />
      <circle v-else cx="9.5" cy="9.5" r="5" stroke-width="3.8" />
    </template>
    <template v-else-if="tool === 'erase'">
      <path d="M10.5 14.5h27M19 14.5v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M14 14.5l1.7 22a3 3 0 0 0 3 2.8h10.6a3 3 0 0 0 3-2.8l1.7-22" />
      <path d="M20.5 21.5v11M27.5 21.5v11" stroke-width="2.6" />
    </template>
    <template v-else-if="tool === 'swap'">
      <path d="M9 17.5h29M31 10.5l7 7-7 7M39 30.5H10M17 23.5l-7 7 7 7" />
    </template>
  </svg>
</template>
