import type { Action, CellValue, GameState, Mark, ToolType } from '../types/game'

// الأدوات الأربع المتاحة لكل لاعب، مرة واحدة لكل واحدة في الجولة
export const TOOLS: ToolType[] = ['square', 'out', 'erase', 'swap']

// ترتيب الخلايا: 0-8 لوحة 3×3، و9-12 الزوايا الأربع خارج اللوحة
// (كأن اللوحة موضوعة في وسط شبكة 5×5 وتُستخدم زوايا الشبكة لإكمال القطر)
// إحداثيات [صف، عمود] كل زاوية في شبكة 5×5 — تُستخدم أيضًا لتحديد موضع كل خلية خارجية في العرض
export const OUT: [number, number][] = [[0, 0], [0, 4], [4, 0], [4, 4]]
export const CELLS = 9 + OUT.length

const inner = (r: number, c: number) => (r - 1) * 3 + c - 1

// كل خلية خارجية تكمّل قطرًا مع الزاوية المجاورة لها ومركز اللوحة
export const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
  ...OUT.map(([r, c], k) => {
    const dr = r === 0 ? 1 : r === 4 ? -1 : 0
    const dc = c === 0 ? 1 : c === 4 ? -1 : 0
    return [9 + k, inner(r + dr, c + dc), inner(r + 2 * dr, c + 2 * dc)]
  }),
]

// خلية قد تحمل null أو 'X' أو 'O' أو 'XO' إذا فتح الطرفان عليها معًا في الافتتاحية؛ التربيع يُخزَّن بنفس الشكل
export const has = (cell: CellValue, p: Mark): boolean => !!cell && cell.includes(p)

const add = (cell: CellValue, p: Mark): CellValue => {
  const x = has(cell, 'X') || p === 'X' ? 'X' : ''
  const o = has(cell, 'O') || p === 'O' ? 'O' : ''
  return (x + o) as CellValue
}

const remove = (cell: CellValue, p: Mark): CellValue => (cell ? ((cell.replace(p, '') || null) as CellValue) : null)

export function createGame(): GameState {
  return {
    board: Array(9).fill(null),
    out: Array(OUT.length).fill(null),
    squared: Array(CELLS).fill(null),
    turn: 'X',
    opening: true,
    used: { X: {}, O: {} },
    winner: null,
    draw: false,
  }
}

// كل خلايا اللعبة بالترتيب: 9 داخل اللوحة ثم 4 خارجها
export const cellsOf = (s: GameState): CellValue[] => [...s.board, ...s.out]

export function winLines(board: CellValue[], out: CellValue[] = []): number[][] {
  const cells = [...board, ...out]
  return LINES.filter(l => (['X', 'O'] as Mark[]).some(p => l.every(i => has(cells[i], p))))
}

export function wins(board: CellValue[], out: CellValue[] = []): Mark[] {
  const cells = [...board, ...out]
  return (['X', 'O'] as Mark[]).filter(p => LINES.some(l => l.every(i => has(cells[i], p))))
}

/** هل يملك `mark` أداة `tool` متاحة الآن (لم تُستخدم، والافتتاحية انتهت، ولها هدف صالح فعلاً)؟ */
export function isToolUsable(s: GameState, mark: Mark, tool: ToolType): boolean {
  if (s.opening || s.used[mark][tool]) return false
  if (tool === 'square') return cellsOf(s).some((m, i) => has(m, mark) && !has(s.squared[i], mark))
  if (tool === 'out') return s.out.includes(null)
  if (tool === 'erase') return cellsOf(s).some(m => has(m, mark === 'X' ? 'O' : 'X'))
  return true
}

/**
 * يطبّق حركة واحدة على الحالة (تعديل مباشر، in-place) ويرجع true إذا كانت صالحة.
 * الفتحة الافتتاحية: كل لاعب يختار خليته الأولى، وقد يلعب الثاني في خلية الأول فتُشارك بينهما.
 * بعد الافتتاحية: كل أداة غش تُستخدم مرة واحدة فقط لكل لاعب، وتستهلك الدور كأي حركة.
 */
export function move(s: GameState, action: Action): boolean {
  if (s.winner || s.draw) return false
  const me = s.turn
  const foe: Mark = me === 'X' ? 'O' : 'X'
  const used = s.used[me]
  const int = (i: number | undefined, max: number): i is number =>
    Number.isInteger(i) && (i as number) >= 0 && (i as number) < max

  if (action.type === 'place') {
    const { index } = action
    if (!int(index, 9) || (s.board[index] && !(s.opening && !has(s.board[index], me)))) return false
    s.board[index] = add(s.board[index], me)
    if (me === 'O') s.opening = false
  }
  else if (s.opening || !TOOLS.includes(action.type) || used[action.type]) {
    return false
  }
  else if (action.type === 'erase') {
    const { index } = action
    if (!int(index, CELLS)) return false
    const cells = index < 9 ? s.board : s.out
    const i = index < 9 ? index : index - 9
    if (!has(cells[i], foe)) return false
    // رمز مربّع ينجو من المسح مرة واحدة: يفقد التربيع فقط
    if (has(s.squared[index], foe)) s.squared[index] = remove(s.squared[index], foe)
    else cells[i] = remove(cells[i], foe)
  }
  else if (action.type === 'out') {
    const { index } = action
    if (!int(index, CELLS) || index < 9 || s.out[index - 9]) return false
    s.out[index - 9] = me
  }
  else if (action.type === 'swap') {
    const { a, b } = action
    if (!int(a, 3) || !int(b, 3) || a === b) return false
    for (let r = 0; r < 3; r++) {
      const i = r * 3 + a
      const j = r * 3 + b
      ;[s.board[i], s.board[j]] = [s.board[j], s.board[i]]
      ;[s.squared[i], s.squared[j]] = [s.squared[j], s.squared[i]]
    }
  }
  else if (action.type === 'square') {
    const { index } = action
    if (!int(index, CELLS) || !has([...s.board, ...s.out][index], me) || has(s.squared[index], me)) return false
    s.squared[index] = add(s.squared[index], me)
  }

  if (action.type !== 'place') used[action.type] = true

  const winners = wins(s.board, s.out)
  if (winners.length === 1) s.winner = winners[0]
  else if (winners.length > 1) s.draw = true

  // لوحة ممتلئة تبقى قابلة للاستمرار إذا كان بإمكان الطرف التالي أن يمسح أو يرسم خارج اللوحة
  const canErase = !s.used[foe].erase && [...s.board, ...s.out].some(x => has(x, me))
  const canOut = !s.used[foe].out && s.out.includes(null)
  if (!s.winner && !s.draw && s.board.every(Boolean) && !canErase && !canOut) s.draw = true

  s.turn = foe
  return true
}
