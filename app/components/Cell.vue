<script setup lang="ts">
import type { CellValue, Mark } from '~~/shared/types/game'
import { has } from '~~/shared/utils/gameEngine'

const props = defineProps<{
  mark: CellValue
  squared: CellValue
  out: boolean
  gridArea: string
  cellLabel: string
  disabled: boolean
  pop: boolean
  target: boolean
  grab: boolean
}>()

defineEmits<{ select: [] }>()

const both = computed(() => props.mark === 'XO')
const squaredHas = (p: Mark) => has(props.squared, p)
</script>

<template>
  <button
    class="cell"
    :class="{ out, pop, target, grab, both }"
    :style="{ gridArea }"
    :aria-label="cellLabel"
    :disabled="disabled"
    @click="$emit('select')"
  >
    <svg v-if="mark === 'XO'" viewBox="0 0 100 100" aria-hidden="true">
      <g class="shared" transform="translate(2 2) scale(.54)">
        <path d="M22 22 78 78M78 22 22 78" />
        <text v-if="squaredHas('X')" class="power" x="90" y="26" text-anchor="middle">2</text>
      </g>
      <g class="shared" transform="translate(44 44) scale(.54)">
        <circle cx="50" cy="50" r="30" />
        <text v-if="squaredHas('O')" class="power" x="90" y="26" text-anchor="middle">2</text>
      </g>
    </svg>
    <svg v-else-if="mark" viewBox="0 0 100 100" aria-hidden="true">
      <path v-if="mark === 'X'" d="M22 22 78 78M78 22 22 78" />
      <circle v-else cx="50" cy="50" r="30" />
      <text v-if="squaredHas(mark)" class="power" x="90" y="26" text-anchor="middle">2</text>
    </svg>
  </button>
</template>
