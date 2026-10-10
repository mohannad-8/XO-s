<script setup lang="ts">
import type { Action, ToolType } from '~~/shared/types/game'

const route = useRoute()
const router = useRouter()
const codeParam = String(route.params.code).toUpperCase()

const { roomCode, mark, state, roomStatus, errorMessage, opponentGone, sendMove, rematch, leaveRoom, joinRoom } = useOnlineRoom()

const tool = ref<ToolType | null>(null)
const confirming = ref(false)

// الافتتاحية متزامنة: الخادم ما يبث شيء إلا بعد اختيار الطرفين، فتبقى state.turn ثابتة عند 'X' طول هذه الفترة.
// نتابع محليًا إذا أرسلنا اختيارنا أو لا، بدل الاعتماد على state.turn (وإلا ما يقدر O يختار، وX يقدر يكرر إرسال نفس الحركة)
const myOpeningSubmitted = ref(false)
watch(state, (s) => {
  if (s?.opening) myOpeningSubmitted.value = false
})
// إذا رُفضت حركتنا فعليًا (رسالة ضاعت بالشبكة مثلًا) ما نبقى مقفولين لحد نهاية الجولة
watch(errorMessage, (msg) => {
  if (msg && state.value?.opening) myOpeningSubmitted.value = false
})

// تحميل مباشر لهذا الرابط (أو إعادة تحميل الصفحة) يعني ما عندنا اتصال/دور فعلاً، فنحاول الانضمام كأننا جايين جدد
onMounted(() => {
  if (!mark.value || roomCode.value !== codeParam) {
    joinRoom(codeParam)
  }
})

const myMark = computed(() => mark.value)
const opponentMark = computed(() => (myMark.value === 'X' ? 'O' : 'X'))
const isOver = computed(() => !!state.value && (!!state.value.winner || state.value.draw))
const humanTurn = computed(() => {
  if (!state.value || !myMark.value || roomStatus.value !== 'in-progress' || isOver.value) return false
  if (state.value.opening) return !myOpeningSubmitted.value
  return state.value.turn === myMark.value
})

const opponentStatus = computed(() => {
  if (roomStatus.value === 'waiting') return ''
  if (opponentGone.value === 'left') return 'الخصم غادر الغرفة'
  if (opponentGone.value === 'disconnected') return 'انقطع اتصال الخصم'
  if (!state.value) return 'جاري الاتصال...'
  if (isOver.value) return 'انتهت الجولة'
  if (state.value.opening) return myOpeningSubmitted.value ? 'بانتظار اختيار الخصم' : 'كل واحد يختار خليته الأولى'
  return state.value.turn === opponentMark.value ? 'دور الخصم' : 'دورك'
})

function onMove(action: Action) {
  if (!humanTurn.value) return
  if (state.value?.opening) myOpeningSubmitted.value = true
  sendMove(action)
}

function selectTool(t: ToolType) {
  tool.value = tool.value === t ? null : t
}

function askReset() {
  confirming.value = true
  tool.value = null
}
function confirmReset() {
  confirming.value = false
  rematch()
}
function cancelReset() {
  confirming.value = false
}

function leaveToHome() {
  if (confirm('تبطّل الجولة وترجع للقائمة؟')) {
    leaveRoom()
    router.push('/')
  }
}

useHead({ title: 'XO؟ — أونلاين' })
</script>

<template>
  <main v-if="state && myMark">
    <section id="top" class="side">
      <RoomCodeBadge v-if="roomStatus === 'waiting'" :code="roomCode ?? codeParam" />
      <OpponentPanel v-else :mark="opponentMark" :state="state" :status-text="opponentStatus" />
    </section>

    <Board :state="state" :human-turn="humanTurn" :tool="tool" @move="onMove" />

    <section id="bottom" class="side">
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <PlayerPanel
        :mark="myMark"
        :state="state"
        :active="humanTurn"
        :confirming="confirming"
        :selected-tool="tool"
        menu-action="leave"
        @select-tool="selectTool"
        @ask-reset="askReset"
        @confirm-reset="confirmReset"
        @cancel-reset="cancelReset"
        @open-menu="leaveToHome"
      />
    </section>
  </main>

  <div v-else class="screen">
    <h1>XO؟ — أونلاين</h1>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <p v-else>جاري الاتصال بالغرفة {{ codeParam }}...</p>
    <NuxtLink class="back-link" to="/online">رجوع</NuxtLink>
  </div>
</template>
