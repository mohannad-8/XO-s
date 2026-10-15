import { allRooms, removeRoom } from '../utils/rooms'

// الغرف تُحذف فورًا عند الخروج أو الانقطاع (room.ts)؛ هذا فقط شبكة أمان
// لغرف "بانتظار لاعب ثاني" نُسيت مفتوحة بدون أي نشاط لفترة طويلة
const IDLE_LIMIT_MS = 30 * 60 * 1000
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

export default defineNitroPlugin(() => {
  setInterval(() => {
    const now = Date.now()
    for (const room of allRooms()) {
      if (now - room.lastActivityAt > IDLE_LIMIT_MS) removeRoom(room.code)
    }
  }, SWEEP_INTERVAL_MS)
})
