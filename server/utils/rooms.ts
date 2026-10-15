import type { Action, GameState, Mark, RoomStatus } from '../../shared/types/game'
import { createGame } from '../../shared/utils/gameEngine'

// نهتم فقط بالطرق التي نستخدمها فعليًا من peer الخاص بـ crossws/h3، بدل الارتباط بنوع داخلي محدد
export interface RoomPeer {
  id: string
  send: (data: string) => void
}

export interface Room {
  code: string
  players: { X: RoomPeer | null, O: RoomPeer | null }
  state: GameState
  // أول حركة "place" من كل لاعب في الافتتاحية تُخزَّن هنا حتى يصل الطرفان، فلا يرى أحدهم خلية الآخر قبل أن يختار
  pendingOpening: { X?: Action, O?: Action }
  status: RoomStatus
  createdAt: number
  lastActivityAt: number
}

const rooms = new Map<string, Room>()

// نستثني O/X/I/0/1 لتفادي الالتباس مع رموز اللعبة نفسها عند قراءة الكود أو كتابته
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWY23456789'
const CODE_LENGTH = 5

function generateCode(): string {
  let code = ''
  do {
    code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
  } while (rooms.has(code))
  return code
}

export function createRoom(peer: RoomPeer): Room {
  const code = generateCode()
  const room: Room = {
    code,
    players: { X: peer, O: null },
    state: createGame(),
    pendingOpening: {},
    status: 'waiting',
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  }
  rooms.set(code, room)
  return room
}

export type JoinResult = { ok: true, room: Room } | { ok: false, code: 'room-not-found' | 'room-full' }

export function joinRoom(code: string, peer: RoomPeer): JoinResult {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { ok: false, code: 'room-not-found' }
  if (room.players.O) return { ok: false, code: 'room-full' }
  room.players.O = peer
  room.status = 'in-progress'
  room.lastActivityAt = Date.now()
  return { ok: true, room }
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase())
}

export function removeRoom(code: string) {
  rooms.delete(code.toUpperCase())
}

/** يحدد غرفة ورمز اللاعب (X/O) اعتمادًا على peer معيّن — يُستخدم عند انقطاع الاتصال. */
export function findByPeer(peer: RoomPeer): { room: Room, mark: Mark } | undefined {
  for (const room of rooms.values()) {
    if (room.players.X?.id === peer.id) return { room, mark: 'X' }
    if (room.players.O?.id === peer.id) return { room, mark: 'O' }
  }
  return undefined
}

export function allRooms(): IterableIterator<Room> {
  return rooms.values()
}
