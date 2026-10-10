<script setup lang="ts">
const { connection, roomCode, errorMessage, createRoom, joinRoom } = useOnlineRoom()
const router = useRouter()
const codeInput = ref('')

watch(roomCode, (code) => {
  if (code) router.push(`/online/${code}`)
})

async function onCreate() {
  await createRoom()
}
async function onJoin() {
  if (!codeInput.value.trim()) return
  await joinRoom(codeInput.value)
}

useHead({ title: 'XO؟ — أونلاين' })
</script>

<template>
  <div class="screen">
    <h1>اللعب أونلاين</h1>
    <p>كل غرفة تتحمّل لاعبين فقط. أنشئ غرفة وشارك كودها مع صديقك، أو ادخل بكود عندك.</p>

    <button class="mode-card" :disabled="connection === 'connecting'" @click="onCreate">
      <strong>إنشاء غرفة جديدة</strong>
      <span>بتحصل على كود تشاركه مع صديقك.</span>
    </button>

    <form class="room-form" @submit.prevent="onJoin">
      <label for="room-code">عندك كود من صديقك؟</label>
      <input
        id="room-code"
        v-model="codeInput"
        class="room-code-input"
        placeholder="ABCDE"
        maxlength="6"
        autocomplete="off"
        dir="ltr"
      >
      <button class="btn primary" type="submit" :disabled="connection === 'connecting' || !codeInput.trim()">
        انضم للغرفة
      </button>
    </form>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <p v-if="connection === 'connecting'">يتصل بالخادم...</p>

    <NuxtLink class="back-link" to="/">رجوع للقائمة</NuxtLink>
  </div>
</template>
