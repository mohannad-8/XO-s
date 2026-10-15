<script setup lang="ts">
import type { GameState, Mark, ToolType } from '~~/shared/types/game'

withDefaults(defineProps<{
  mark: Mark
  state: GameState
  active: boolean
  showTools?: boolean
  showThemeToggle?: boolean
  confirming?: boolean
  selectedTool?: ToolType | null
  /** 'menu' لتبديل الوضع محليًا، 'leave' للمغادرة (أونلاين) — يغيّر الأيقونة والتسمية */
  menuAction?: 'menu' | 'leave'
}>(), {
  showTools: true,
  showThemeToggle: false,
  confirming: false,
  selectedTool: null,
  menuAction: 'menu',
})

const emit = defineEmits<{
  selectTool: [tool: ToolType]
  askReset: []
  confirmReset: []
  cancelReset: []
  openMenu: []
  toggleTheme: []
}>()
</script>

<template>
  <div>
    <ToolTray
      v-if="showTools"
      :mark="mark"
      :state="state"
      :selected="selectedTool"
      :active="active"
      @select="emit('selectTool', $event)"
    />
    <div v-if="confirming" class="confirm">
      <button class="btn danger" @click="emit('confirmReset')">من جديد</button>
      <button class="btn" @click="emit('cancelReset')">بطلت</button>
    </div>
    <div v-else class="icons" dir="ltr">
      <button class="icon-btn" aria-label="جولة جديدة" @click="emit('askReset')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5" /></svg>
      </button>
      <button class="icon-btn" :aria-label="menuAction === 'leave' ? 'مغادرة الغرفة' : 'القائمة'" @click="emit('openMenu')">
        <svg v-if="menuAction === 'leave'" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
      </button>
      <button v-if="showThemeToggle" class="icon-btn" aria-label="فاتح أو داكن" @click="emit('toggleTheme')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        </svg>
      </button>
    </div>
  </div>
</template>
