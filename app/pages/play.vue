<script setup lang="ts">
const route = useRoute()

const VALID_MODES = ['surprise', 'ai', 'local'] as const
const initialMode = VALID_MODES.includes(route.query.mode as typeof VALID_MODES[number])
  ? (route.query.mode as typeof VALID_MODES[number])
  : 'surprise'

const {
  state, mode, tool, confirmingMark, thinking, mood, aiTool, revealed, isOver,
  play, reset, switchMode, selectTool, askReset, cancelReset,
} = useLocalGame(initialMode)

const { toggle: toggleTheme } = useTheme()

const vsAI = computed(() => mode.value !== 'local')
const humanTurn = computed(() => !isOver.value && !thinking.value && (!vsAI.value || state.turn === 'X'))
const xActive = computed(() => !isOver.value && !thinking.value && state.turn === 'X')
const oActive = computed(() => !isOver.value && !thinking.value && state.turn === 'O')

const menuDialog = ref<{ open: (flip: boolean) => void; close: () => void } | null>(null)
const helpDialog = ref<{ open: (flip?: boolean) => void; close: () => void } | null>(null)

function openMenu(flipped: boolean) {
  menuDialog.value?.open(flipped)
}
function onShowHelp(flipped: boolean) {
  helpDialog.value?.open(flipped)
}

useHead({ title: 'XO؟' })
</script>

<template>
  <main>
    <section id="top" class="side" :class="{ flipped: !vsAI }">
      <AiFace v-if="vsAI" :mode="mode === 'surprise' ? 'surprise' : 'ai'" :mood="mood" :state="state" :ai-tool="aiTool" />
      <PlayerPanel
        v-else
        mark="O"
        :state="state"
        :active="oActive"
        :confirming="confirmingMark === 'O'"
        :selected-tool="tool"
        @select-tool="selectTool"
        @ask-reset="askReset('O')"
        @confirm-reset="reset"
        @cancel-reset="cancelReset"
        @open-menu="openMenu(true)"
      />
    </section>

    <Board :state="state" :human-turn="humanTurn" :tool="tool" @move="play" />

    <section id="bottom" class="side">
      <p v-if="revealed" class="reveal">الغش مسموح</p>
      <PlayerPanel
        mark="X"
        :state="state"
        :active="xActive"
        :show-tools="mode !== 'surprise'"
        :show-theme-toggle="mode === 'ai'"
        :confirming="confirmingMark === 'X'"
        :selected-tool="tool"
        @select-tool="selectTool"
        @ask-reset="askReset('X')"
        @confirm-reset="reset"
        @cancel-reset="cancelReset"
        @open-menu="openMenu(false)"
        @toggle-theme="toggleTheme"
      />
    </section>
  </main>

  <MenuDialog ref="menuDialog" :current-mode="mode" :show-rules-link="mode !== 'surprise'" @select-mode="switchMode" @show-help="onShowHelp" />
  <HelpDialog ref="helpDialog" />
</template>
