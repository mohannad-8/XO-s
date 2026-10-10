import type { Action, GameState, Mark, RoomStatus } from '~~/shared/types/game'

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed'
type OpponentGone = 'left' | 'disconnected' | null

interface ServerMessage {
  type: string
  code?: string
  mark?: Mark
  state?: GameState
  status?: RoomStatus
  message?: string
}

// حالة واحدة مشتركة بين صفحة اللوبي وصفحة اللعب — نفس اتصال WebSocket يستمر عبر التنقل بينهما
const connection = ref<ConnectionStatus>('idle')
const roomCode = ref<string | null>(null)
const mark = ref<Mark | null>(null)
const state = ref<GameState | null>(null)
const roomStatus = ref<RoomStatus | null>(null)
const errorMessage = ref<string | null>(null)
const opponentGone = ref<OpponentGone>(null)

let socket: WebSocket | null = null
let connectingPromise: Promise<WebSocket> | null = null

function wsUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${location.host}/ws/room`
}

function handleMessage(raw: string) {
  let msg: ServerMessage
  try {
    msg = JSON.parse(raw)
  }
  catch {
    return
  }
  switch (msg.type) {
    case 'room-created':
    case 'room-joined':
      roomCode.value = msg.code ?? null
      mark.value = msg.mark ?? null
      roomStatus.value = msg.type === 'room-created' ? 'waiting' : roomStatus.value
      opponentGone.value = null
      errorMessage.value = null
      break
    case 'state-sync':
      state.value = msg.state ?? null
      roomStatus.value = msg.status ?? null
      opponentGone.value = null
      break
    case 'opponent-left':
      opponentGone.value = 'left'
      break
    case 'opponent-disconnected':
      opponentGone.value = 'disconnected'
      break
    case 'error':
      errorMessage.value = msg.message ?? 'حدث خطأ غير متوقع'
      break
  }
}

function ensureSocket(): Promise<WebSocket> {
  if (socket && connection.value === 'connected') return Promise.resolve(socket)
  if (connectingPromise) return connectingPromise

  connection.value = 'connecting'
  connectingPromise = new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(wsUrl())
    ws.addEventListener('open', () => {
      connection.value = 'connected'
      socket = ws
      connectingPromise = null
      resolve(ws)
    })
    ws.addEventListener('message', e => handleMessage(e.data))
    ws.addEventListener('close', () => {
      connection.value = 'closed'
    })
    ws.addEventListener('error', () => {
      errorMessage.value = 'تعذّر الاتصال بالخادم'
      connectingPromise = null
      reject(new Error('ws-connect-failed'))
    })
  })
  return connectingPromise
}

function send(payload: Record<string, unknown>) {
  socket?.send(JSON.stringify(payload))
}

function resetLocal() {
  socket = null
  connection.value = 'idle'
  roomCode.value = null
  mark.value = null
  state.value = null
  roomStatus.value = null
  errorMessage.value = null
  opponentGone.value = null
}

export function useOnlineRoom() {
  async function createRoom() {
    errorMessage.value = null
    await ensureSocket()
    send({ type: 'create-room' })
  }

  async function joinRoom(code: string) {
    errorMessage.value = null
    await ensureSocket()
    send({ type: 'join-room', code: code.trim().toUpperCase() })
  }

  function sendMove(action: Action) {
    send({ type: 'make-move', action })
  }

  function rematch() {
    send({ type: 'rematch' })
  }

  function leaveRoom() {
    send({ type: 'leave-room' })
    socket?.close()
    resetLocal()
  }

  return {
    connection,
    roomCode,
    mark,
    state,
    roomStatus,
    errorMessage,
    opponentGone,
    createRoom,
    joinRoom,
    sendMove,
    rematch,
    leaveRoom,
  }
}
