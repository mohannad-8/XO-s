export type Mark = 'X' | 'O'

// null = فاضية، 'X'/'O' = رمز واحد، 'XO' = فتح الاثنان على نفس الخلية في الافتتاحية
export type CellValue = null | 'X' | 'O' | 'XO'

export type ToolType = 'square' | 'out' | 'erase' | 'swap'

export type Action =
  | { type: 'place'; index: number }
  | { type: 'square'; index: number }
  | { type: 'out'; index: number }
  | { type: 'erase'; index: number }
  | { type: 'swap'; a: number; b: number }

export interface GameState {
  board: CellValue[]
  out: CellValue[]
  squared: CellValue[]
  turn: Mark
  opening: boolean
  used: Record<Mark, Partial<Record<ToolType, boolean>>>
  winner: Mark | null
  draw: boolean
}

// 'surprise': يلعب بأمانة حتى يفوز بغشة out مفاجئة. 'cheat': يستغل كل أدواته بعدوانية.
export type AiStyle = 'surprise' | 'cheat'

export type RoomStatus = 'waiting' | 'in-progress' | 'finished'
