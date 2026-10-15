<script setup lang="ts">
import type { GameState, Mark } from '~~/shared/types/game'

defineProps<{
  mark: Mark
  state: GameState
  statusText: string
}>()
</script>

<template>
  <div class="ai online" dir="ltr">
    <p class="opponent-status" dir="rtl">{{ statusText }}</p>
    <ToolTray :mark="mark" :state="state" readonly />
  </div>
</template>
