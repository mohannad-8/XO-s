import type { Action, AiStyle, GameState, Mark } from '../types/game'
import { has, move } from './gameEngine'

const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

// يحاكي حركة على نسخة من الحالة دون التأثير على الأصل؛ يرجع null إذا كانت الحركة غير صالحة
const sim = (s: GameState, action: Action): GameState | null => {
  const t = structuredClone(s)
  return move(t, action) ? t : null
}

const isPlace = (a: Action): a is { type: 'place'; index: number } => a.type === 'place'
const isOut = (a: Action): a is { type: 'out'; index: number } => a.type === 'out'
const isErase = (a: Action): a is { type: 'erase'; index: number } => a.type === 'erase'

/** كل الحركات الممكنة للطرف الحالي: تعليم + كل أداة غير مستخدمة بعد انتهاء الافتتاحية. */
export function actions(s: GameState): Action[] {
  const me = s.turn
  const foe: Mark = me === 'X' ? 'O' : 'X'
  const used = s.used[me]
  const empty = [...s.board.keys()].filter(i => !s.board[i])

  const list: Action[] = empty.map(index => ({ type: 'place', index }))

  if (!used.out) {
    s.out.forEach((mark, k) => { if (!mark) list.push({ type: 'out', index: 9 + k }) })
  }
  if (!used.square) {
    ;[...s.board, ...s.out].forEach((mark, index) => {
      if (has(mark, me) && !has(s.squared[index], me)) list.push({ type: 'square', index })
    })
  }
  if (!used.swap) {
    for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) list.push({ type: 'swap', a, b })
  }
  if (!used.erase) {
    ;[...s.board, ...s.out].forEach((mark, index) => {
      if (has(mark, foe)) list.push({ type: 'erase', index })
    })
  }

  return list
}

/** الخلايا الداخلية التي يفوز فيها `who` فورًا لو لعب فيها الآن. */
export function threats(s: GameState, who: Mark): number[] {
  const t: GameState = { ...s, turn: who }
  return [...s.board.keys()].filter(i => !s.board[i] && sim(t, { type: 'place', index: i })?.winner === who)
}

// الافتتاحية متزامنة فالجهاز يختار دون رؤية خلية اللاعب؛ وضع "المفاجأة" يفضّل المركز دائمًا
// (كل خط قطري خارجي يمر به). يأخذ وضع اللعب الخام (وليس AiStyle) لأنه يفحص فقط 'surprise'
export const openingPick = (mode: string): number =>
  mode === 'surprise' || Math.random() < 0.45 ? 4 : pick([0, 2, 6, 8, 1, 3, 5, 7])

/**
 * 'surprise': يلعب بأمانة حتى يقدر يفوز بغشة out مفاجئة.
 * 'cheat': يستغل كل أدواته بعدوانية (مثل المسح لتقليل عدد التهديدات).
 */
export function chooseAction(s: GameState, style: AiStyle): Action {
  const me = s.turn
  const foe: Mark = me === 'X' ? 'O' : 'X'
  const all = actions(s)
  const places = all.filter(isPlace)
  const winning = all.filter(a => sim(s, a)?.winner === me)
  const honest = winning.filter(isPlace)

  if (style === 'surprise') {
    const outside = winning.filter(isOut)
    if (outside.length) return pick(outside)
  }
  else if (winning.length) {
    return pick(honest.length ? honest : winning)
  }

  const danger = threats(s, foe)
  if (danger.length) {
    if (style === 'cheat' && danger.length > 1 && !s.used[me].erase) {
      const erases = all
        .filter(isErase)
        .map(a => ({ a, left: threats(sim(s, a)!, foe).length }))
        .sort((x, y) => x.left - y.left)
      if (erases.length && erases[0].left < danger.length) return erases[0].a
    }
    return { type: 'place', index: pick(danger) }
  }

  if (style === 'surprise') {
    if (honest.length) return pick(honest)
    // زاوية بجانب مركزه عشان يكمّل القطر من خارج اللوحة في الدور القادم
    const setups = places.filter((a) => {
      const t = sim(s, a)
      if (!t) return false
      t.turn = me
      return actions(t).some(b => isOut(b) && sim(t, b)?.winner === me)
    })
    if (setups.length) return pick(setups)
  }

  for (const group of [[4], [0, 2, 6, 8], [1, 3, 5, 7]]) {
    const options = places.filter(a => group.includes(a.index))
    if (options.length) return pick(options)
  }

  // اللوحة ممتلئة: ما تبقى غير أدوات الغش
  const outside = all.filter(isOut)
  return pick(outside.length ? outside : all)
}
