import type { Action } from '../../../shared/types/game'
import { createGame, move } from '../../../shared/utils/gameEngine'
import { createRoom, findByPeer, joinRoom, removeRoom, type Room, type RoomPeer } from '../../utils/rooms'

type ErrorCode = 'room-not-found' | 'room-full' | 'not-your-turn' | 'invalid-move' | 'bad-request'

function send(peer: RoomPeer, payload: unknown) {
  peer.send(JSON.stringify(payload))
}

function sendError(peer: RoomPeer, code: ErrorCode, message: string) {
  send(peer, { type: 'error', code, message })
}

function broadcastState(room: Room) {
  const payload = { type: 'state-sync', state: room.state, status: room.status }
  if (room.players.X) send(room.players.X, payload)
  if (room.players.O) send(room.players.O, payload)
}

function notifyOpponent(room: Room, self: RoomPeer, payload: unknown) {
  const other = room.players.X?.id === self.id ? room.players.O : room.players.X
  if (other) send(other, payload)
}

function isValidAction(a: unknown): a is Action {
  if (!a || typeof a !== 'object') return false
  const type = (a as { type?: unknown }).type
  return type === 'place' || type === 'square' || type === 'out' || type === 'erase' || type === 'swap'
}

function handleCreateRoom(peer: RoomPeer) {
  if (findByPeer(peer)) return sendError(peer, 'bad-request', 'أنت في غرفة بالفعل')
  const room = createRoom(peer)
  send(peer, { type: 'room-created', code: room.code, mark: 'X' })
}

function handleJoinRoom(peer: RoomPeer, code: unknown) {
  if (typeof code !== 'string' || !code.trim()) return sendError(peer, 'bad-request', 'كود غير صالح')
  if (findByPeer(peer)) return sendError(peer, 'bad-request', 'أنت في غرفة بالفعل')
  const result = joinRoom(code, peer)
  if (!result.ok) {
    return sendError(
      peer,
      result.code,
      result.code === 'room-full' ? 'الغرفة مكتملة بلاعبين بالفعل' : 'ما لقينا غرفة بهذا الكود',
    )
  }
  send(peer, { type: 'room-joined', code: result.room.code, mark: 'O' })
  broadcastState(result.room)
}

function handleMakeMove(peer: RoomPeer, action: unknown) {
  const found = findByPeer(peer)
  if (!found) return sendError(peer, 'bad-request', 'ما أنت داخل غرفة')
  const { room, mark } = found

  if (room.status === 'waiting') return sendError(peer, 'bad-request', 'بانتظار انضمام اللاعب الثاني')
  if (room.status === 'finished') return sendError(peer, 'invalid-move', 'الجولة خلصت، اطلب جولة جديدة')
  if (!isValidAction(action)) return sendError(peer, 'invalid-move', 'حركة غير صالحة')

  // الفتحة متزامنة: نخزّن أول حركة من كل لاعب، وما نطبّقها بالمحرك إلا لما يصل الطرفان
  // — هذا يمنع أي طرف من رؤية خلية الآخر قبل أن يختار خليته هو
  if (room.state.opening) {
    if (action.type !== 'place') return sendError(peer, 'invalid-move', 'لسه بالافتتاحية')
    if (room.pendingOpening[mark]) return sendError(peer, 'invalid-move', 'اخترت خليتك في الافتتاحية فعلاً')
    room.pendingOpening[mark] = action
    room.lastActivityAt = Date.now()
    if (room.pendingOpening.X && room.pendingOpening.O) {
      // ترتيب ثابت (X ثم O) تمامًا كما يفعل المحرك محليًا
      move(room.state, room.pendingOpening.X)
      move(room.state, room.pendingOpening.O)
      room.pendingOpening = {}
      if (room.state.winner || room.state.draw) room.status = 'finished'
      broadcastState(room)
    }
    return
  }

  // المحرك نفسه لا يعرف من يسأل — السيرفر يتحقق من صاحب الدور الحقيقي قبل أي استدعاء
  if (room.state.turn !== mark) return sendError(peer, 'not-your-turn', 'لسه مب دورك')

  if (!move(room.state, action)) return sendError(peer, 'invalid-move', 'حركة غير صالحة')
  room.lastActivityAt = Date.now()
  if (room.state.winner || room.state.draw) room.status = 'finished'
  broadcastState(room)
}

function handleRematch(peer: RoomPeer) {
  const found = findByPeer(peer)
  if (!found) return sendError(peer, 'bad-request', 'ما أنت داخل غرفة')
  const { room } = found
  room.state = createGame()
  room.pendingOpening = {}
  room.status = room.players.X && room.players.O ? 'in-progress' : 'waiting'
  room.lastActivityAt = Date.now()
  broadcastState(room)
}

function handleLeaveRoom(peer: RoomPeer) {
  const found = findByPeer(peer)
  if (!found) return
  notifyOpponent(found.room, peer, { type: 'opponent-left' })
  removeRoom(found.room.code)
}

function handleDisconnect(peer: RoomPeer) {
  const found = findByPeer(peer)
  if (!found) return
  notifyOpponent(found.room, peer, { type: 'opponent-disconnected' })
  removeRoom(found.room.code)
}

export default defineWebSocketHandler({
  message(peer, message) {
    let data: { type?: unknown, code?: unknown, action?: unknown } | null = null
    try {
      data = JSON.parse(message.text())
    }
    catch {
      return sendError(peer, 'bad-request', 'رسالة غير صالحة')
    }
    if (!data || typeof data.type !== 'string') return sendError(peer, 'bad-request', 'رسالة غير صالحة')

    switch (data.type) {
      case 'create-room':
        return handleCreateRoom(peer)
      case 'join-room':
        return handleJoinRoom(peer, data.code)
      case 'make-move':
        return handleMakeMove(peer, data.action)
      case 'rematch':
        return handleRematch(peer)
      case 'leave-room':
        return handleLeaveRoom(peer)
      default:
        return sendError(peer, 'bad-request', 'نوع رسالة غير معروف')
    }
  },

  close(peer) {
    handleDisconnect(peer)
  },
})
