<script setup lang="ts">
import type { Action, GameState, ToolType } from '~~/shared/types/game'
import { cellsOf, has, OUT, winLines } from '~~/shared/utils/gameEngine'

const props = defineProps<{
  state: GameState
  humanTurn: boolean
  tool: ToolType | null
}>()

const emit = defineEmits<{ move: [action: Action] }>()

const boardEl = ref<HTMLElement | null>(null)

// "ينبض" الرمز الذي ظهر هذا الدور فقط (مقارنة بالحالة قبل آخر تحديث)
const poppedCells = ref<boolean[]>(Array(13).fill(false))
watch(
  () => cellsOf(props.state),
  (next, prev) => {
    poppedCells.value = next.map((m, i) => !!m && m !== prev?.[i])
  },
)

function gridArea(i: number): string {
  if (i > 8) {
    const [r, c] = OUT[i - 9]
    return `${r + 1}/${c + 1}`
  }
  return `${Math.floor(i / 3) + 2}/${i % 3 + 2}`
}

function ariaLabel(i: number, mark: string | null, squared: string | null): string {
  const where = i > 8 ? `برا اللوحة، زاوية ${i - 8}` : `صف ${Math.floor(i / 3) + 1} عمود ${i % 3 + 1}`
  const content = mark ? [...mark].join(' و ') + (squared ? ' تربيع' : '') : 'فاضي'
  return `${where}: ${content}`
}

const cells = computed(() => {
  const me = props.state.turn
  const foe = me === 'X' ? 'O' : 'X'
  return cellsOf(props.state).map((mark, i) => {
    const out = i > 8
    const squared = props.state.squared[i]
    const theirs = has(mark, foe)
    const mine = has(mark, me) && !has(squared, me)
    // في الافتتاحية يجوز للاعب الثاني أن ينزل على خلية اللاعب الأول
    const taken = !!mark && !(props.state.opening && !has(mark, me))
    const disabled = !props.humanTurn || (
      props.tool === 'erase' ? !theirs
      : props.tool === 'square' ? !mine
      : props.tool === 'out' ? (!out || !!mark)
      : props.tool === 'swap' ? out
      : (out || taken)
    )
    const target = props.humanTurn && (
      (props.tool === 'erase' && theirs)
      || (props.tool === 'square' && mine)
      || (props.tool === 'out' && out && !mark)
    )
    const grab = props.humanTurn && props.tool === 'swap' && !out
    return {
      index: i,
      mark,
      squared,
      out,
      disabled,
      target,
      grab,
      pop: poppedCells.value[i],
      gridArea: gridArea(i),
      ariaLabel: ariaLabel(i, mark, squared),
    }
  })
})

function onSelect(i: number) {
  // الأعمدة تُبدَّل بالسحب لا بالنقر
  if (props.tool === 'swap') return
  emit('move', { type: props.tool ?? 'place', index: i } as Action)
}

// خط أحمر يمر فوق كل تسطير مكتمل، يتجاوز نهايتيه بمقدار صغير
const strikes = ref<{ x1: number; y1: number; x2: number; y2: number }[]>([])

function updateStrikes() {
  const root = boardEl.value
  if (!root) return
  const lines = winLines(props.state.board, props.state.out)
  if (!lines.length) {
    strikes.value = []
    return
  }
  const cellEls = Array.from(root.querySelectorAll<HTMLElement>('.cell'))
  const box = root.getBoundingClientRect()
  const mid = (i: number): [number, number] => {
    const r = cellEls[i].getBoundingClientRect()
    return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]
  }
  strikes.value = lines.map(([a, , c]) => {
    const [x1, y1] = mid(a)
    const [x2, y2] = mid(c)
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const ex = (x2 - x1) / len * 26
    const ey = (y2 - y1) / len * 26
    return { x1: x1 - ex, y1: y1 - ey, x2: x2 + ex, y2: y2 + ey }
  })
}

watch(() => props.state, () => nextTick(updateStrikes), { deep: true, flush: 'post' })
onMounted(() => {
  updateStrikes()
  addEventListener('resize', updateStrikes)
})
onUnmounted(() => removeEventListener('resize', updateStrikes))

// سحب عمود كامل وتركه فوق عمود آخر فيتبادلان المكان
interface Drag { id: number; col: number; target: number; startX: number; cells: HTMLElement[]; centers: number[] }
let drag: Drag | null = null

function resetDragVisuals(cells: HTMLElement[]) {
  cells.forEach((c) => { c.classList.remove('dragging'); c.style.transform = '' })
}

function onPointerDown(e: PointerEvent) {
  const cell = (e.target as HTMLElement).closest<HTMLElement>('.cell.grab')
  if (!cell || drag || !boardEl.value) return
  const cellList = Array.from(boardEl.value.querySelectorAll<HTMLElement>('.cell:not(.out)'))
  const col = cellList.indexOf(cell) % 3
  const centers = [0, 1, 2].map((c) => {
    const r = cellList[c].getBoundingClientRect()
    return r.left + r.width / 2
  })
  drag = { id: e.pointerId, col, target: col, startX: e.clientX, cells: cellList, centers }
  try { boardEl.value.setPointerCapture(e.pointerId) }
  catch { /* بعض المتصفحات لا تدعم pointer capture على عناصر معينة */ }
  cellList.forEach((c, i) => c.classList.toggle('dragging', i % 3 === col))
}

function onPointerMove(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.id) return
  const { col, cells, centers } = drag
  const from = centers[col]
  const dx = Math.max(Math.min(...centers) - from, Math.min(Math.max(...centers) - from, e.clientX - drag.startX))
  drag.target = centers.reduce((best, c, i) => Math.abs(c - from - dx) < Math.abs(centers[best] - from - dx) ? i : best, col)
  // العمود تحت الإصبع يتبعه؛ الذي يلامسه ينزلق إلى الفراغ
  cells.forEach((c, i) => {
    const k = i % 3
    c.style.transform = k === col ? `translateX(${dx}px)` : k === drag!.target ? `translateX(${from - centers[k]}px)` : ''
  })
}

function endDrag(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.id) return
  const { col, target, cells } = drag
  drag = null
  resetDragVisuals(cells)
  if (e.type === 'pointerup' && target !== col) emit('move', { type: 'swap', a: col, b: target })
}
</script>

<template>
  <div
    id="board"
    ref="boardEl"
    role="group"
    aria-label="لوحة اللعب"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointercancel="endDrag"
  >
    <Cell
      v-for="c in cells"
      :key="c.index"
      :mark="c.mark"
      :squared="c.squared"
      :out="c.out"
      :grid-area="c.gridArea"
      :cell-label="c.ariaLabel"
      :disabled="c.disabled"
      :pop="c.pop"
      :target="c.target"
      :grab="c.grab"
      @select="onSelect(c.index)"
    />
    <svg v-if="strikes.length" class="strike" aria-hidden="true">
      <line v-for="(s, i) in strikes" :key="i" :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2" />
    </svg>
  </div>
</template>
