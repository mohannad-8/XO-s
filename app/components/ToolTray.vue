<script setup lang="ts">
import type { GameState, Mark, ToolType } from '~~/shared/types/game'
import { isToolUsable, TOOLS } from '~~/shared/utils/gameEngine'

withDefaults(defineProps<{
  mark: Mark
  state: GameState
  /** الأداة المختارة حاليًا، أو آخر أداة استُخدمت (في العرض فقط) */
  selected?: ToolType | null
  /** هل يملك هذا اللاعب الدور الآن فعليًا (أوضاع تفاعلية فقط) */
  active?: boolean
  /** true = عرض فقط (أدوات الجهاز أو الخصم الأونلاين)، لا نقر */
  readonly?: boolean
  size?: 'normal' | 'small'
}>(), {
  selected: null,
  active: false,
  readonly: false,
  size: 'normal',
})

const emit = defineEmits<{ select: [tool: ToolType] }>()

const LABEL: Record<ToolType, string> = {
  square: 'احمِ رمزك بالتربيع',
  out: 'ارسم برا اللوحة',
  erase: 'امسح رمز خصمك',
  swap: 'اسحب عمود مكان عمود ثاني',
}
</script>

<template>
  <div class="tools" :class="{ small: size === 'small' }" :dir="readonly ? undefined : 'ltr'" :aria-hidden="readonly || undefined">
    <template v-if="!readonly">
      <button
        v-for="t in TOOLS"
        :key="t"
        class="tool"
        :class="{ selected: active && selected === t }"
        :aria-label="LABEL[t]"
        :aria-pressed="active && selected === t"
        :disabled="!(active && isToolUsable(state, mark, t))"
        @click="emit('select', t)"
      >
        <ToolIcon :tool="t" :mark="mark" />
      </button>
    </template>
    <template v-else>
      <span
        v-for="t in TOOLS"
        :key="t"
        class="tool"
        :class="{ selected: selected === t, used: state.used[mark][t] && selected !== t }"
      >
        <ToolIcon :tool="t" :mark="mark" />
      </span>
    </template>
  </div>
</template>
