<script setup lang="ts">
import type { GameState, ToolType } from '~~/shared/types/game'

defineProps<{
  mode: 'surprise' | 'ai'
  mood: 'neutral' | 'smug' | 'sad' | 'shock'
  state: GameState
  aiTool: ToolType | null
}>()
</script>

<template>
  <div class="ai" :class="mode" dir="ltr">
    <span class="face" role="img" aria-label="الجهاز">
      <svg viewBox="0 0 64 56" aria-hidden="true">
        <rect x="4" y="4" width="56" height="38" rx="8" />
        <path d="M25 48h14" />
        <circle cx="32" cy="23" r="12" />
        <circle class="eye" cx="28" cy="20" r="1.4" />
        <circle class="eye" cx="36" cy="20" r="1.4" />
        <path v-if="mood === 'neutral'" d="M27.5 28h9" />
        <path v-else-if="mood === 'smug'" d="M27 27q5.5 4.5 10-1.5" />
        <path v-else-if="mood === 'sad'" d="M27.5 29.5q4.5-4 9 0" />
        <circle v-else-if="mood === 'shock'" cx="32" cy="28.5" r="2" />
      </svg>
    </span>
    <ToolTray v-if="mode === 'ai'" class="flipped" size="small" mark="O" :state="state" :selected="aiTool" readonly />
  </div>
</template>
