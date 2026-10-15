import type { Action, AiStyle, GameState, Mark, ToolType } from '~~/shared/types/game'
import { chooseAction, openingPick } from '~~/shared/utils/aiEngine'
import { createGame, move } from '~~/shared/utils/gameEngine'

export type LocalMode = 'surprise' | 'ai' | 'local'
export type Mood = 'neutral' | 'smug' | 'sad' | 'shock'

const AI_DELAY = 1300

/**
 * يدير أوضاع اللعب المحلية الثلاثة (صدمة / ضد الجهاز / لاعبين على نفس الجهاز).
 * منفذ سلوكيًا من دوال play()/reset() الأصلية في app.js، بلا اتصال شبكي.
 */
export function useLocalGame(initialMode: LocalMode) {
  const state = reactive<GameState>(createGame())
  const mode = ref<LocalMode>(initialMode)
  const tool = ref<ToolType | null>(null)
  const confirmingMark = ref<Mark | null>(null)
  const thinking = ref(false)
  const mood = ref<Mood>('neutral')
  const aiTool = ref<ToolType | null>(null)
  // المفاجأة: الجهاز يغش أول مرة بدون تحذير، وبعدها تنكشف اللعبة وتظهر الأدوات
  const revealed = ref(false)

  // يلغي رد الجهاز المؤجل إذا بدأت جولة جديدة قبل أن يصل دوره
  let turnId = 0

  const isOver = computed(() => !!state.winner || state.draw)

  function play(action: Action) {
    const who = state.turn
    if (!move(state, action)) return
    const cheated = action.type !== 'place'
    tool.value = null
    confirmingMark.value = null

    if (mode.value !== 'local') {
      if (who === 'X') {
        mood.value = cheated ? 'shock' : 'neutral'
        aiTool.value = null
      }
      else {
        aiTool.value = cheated ? action.type : null
        mood.value = cheated ? 'smug' : 'neutral'
        if (cheated && mode.value === 'surprise') {
          mode.value = 'ai'
          revealed.value = true
        }
      }
      if (state.winner) mood.value = state.winner === 'O' ? 'smug' : 'sad'
    }

    thinking.value = mode.value !== 'local' && !isOver.value && state.turn === 'O'
    if (thinking.value) {
      const id = ++turnId
      setTimeout(() => {
        if (id !== turnId) return
        thinking.value = false
        const style: AiStyle = mode.value === 'surprise' ? 'surprise' : 'cheat'
        // chooseAction يستدعي structuredClone داخليًا لمحاكاة حركات افتراضية، وهذا يفشل على Proxy تفاعلي من Vue
        // (state هنا reactive لتحديث الواجهة تلقائيًا) — نمرّر نسخة خام (toRaw) لأن chooseAction يقرأ فقط ولا يُعدّل
        play(state.opening ? { type: 'place', index: openingPick(mode.value) } : chooseAction(toRaw(state), style))
      }, AI_DELAY)
    }
  }

  function reset() {
    Object.assign(state, createGame())
    tool.value = null
    confirmingMark.value = null
    thinking.value = false
    mood.value = 'neutral'
    aiTool.value = null
    revealed.value = false
    turnId++
  }

  // قبل المفاجأة الأول يرى اللاعب "ضد الجهاز" فقط، واختياره يتابع المفاجأة بدل كسرها
  function switchMode(next: 'ai' | 'local') {
    const target = next === 'ai' && mode.value === 'surprise' ? 'surprise' : next
    if (target !== mode.value) {
      mode.value = target
      reset()
    }
  }

  function selectTool(t: ToolType) {
    tool.value = tool.value === t ? null : t
    confirmingMark.value = null
  }

  function askReset(mark: Mark) {
    const empty = !state.board.some(Boolean) && !state.out.some(Boolean)
    if (isOver.value || empty) {
      reset()
      return
    }
    confirmingMark.value = mark
    tool.value = null
  }

  function cancelReset() {
    confirmingMark.value = null
  }

  return {
    state,
    mode,
    tool,
    confirmingMark,
    thinking,
    mood,
    aiTool,
    revealed,
    isOver,
    play,
    reset,
    switchMode,
    selectTool,
    askReset,
    cancelReset,
  }
}
