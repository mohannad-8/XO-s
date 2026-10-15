<script setup lang="ts">
defineProps<{
  currentMode: 'surprise' | 'ai' | 'local'
  showRulesLink: boolean
}>()

const emit = defineEmits<{
  selectMode: [mode: 'ai' | 'local']
  showHelp: [flipped: boolean]
}>()

const dialogEl = ref<HTMLDialogElement | null>(null)
const flipped = ref(false)

function open(flip: boolean) {
  flipped.value = flip
  dialogEl.value?.showModal()
}
function close() {
  dialogEl.value?.close()
}
defineExpose({ open, close })

function choose(mode: 'ai' | 'local') {
  close()
  emit('selectMode', mode)
}
function openHelp() {
  close()
  emit('showHelp', flipped.value)
}
</script>

<template>
  <dialog id="menu" ref="dialogEl" :class="{ flipped }" @click="(e) => { if (e.target === dialogEl) close() }">
    <button class="btn" :class="{ primary: currentMode !== 'local' }" @click="choose('ai')">ضد الجهاز</button>
    <button class="btn" :class="{ primary: currentMode === 'local' }" @click="choose('local')">لاعبين على نفس الجهاز</button>
    <button v-if="showRulesLink" class="link" @click="openHelp">القواعد</button>
  </dialog>
</template>
