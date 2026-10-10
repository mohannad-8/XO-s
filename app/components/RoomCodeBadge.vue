<script setup lang="ts">
const props = defineProps<{ code: string }>()
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
  catch {
    // بعض المتصفحات تمنع الكتابة للحافظة بدون صلاحية؛ يقدر المستخدم ينسخ الكود يدويًا من الشاشة
  }
}
</script>

<template>
  <div>
    <p class="opponent-status">بانتظار اللاعب الثاني... شارك هذا الكود وياه:</p>
    <div class="room-code-display">
      <span dir="ltr">{{ code }}</span>
      <button class="icon-btn" aria-label="نسخ الكود" @click="copy">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
        </svg>
      </button>
    </div>
    <p v-if="copied" class="opponent-status">تم نسخ الكود</p>
  </div>
</template>
