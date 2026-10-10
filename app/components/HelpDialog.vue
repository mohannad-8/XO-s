<script setup lang="ts">
const dialogEl = ref<HTMLDialogElement | null>(null)
const flipped = ref(false)

function open(flip = false) {
  flipped.value = flip
  dialogEl.value?.showModal()
}
function close() {
  dialogEl.value?.close()
}
defineExpose({ open, close })
</script>

<template>
  <dialog id="help" ref="dialogEl" :class="{ flipped }" @click="(e) => { if (e.target === dialogEl) close() }">
    <h2>الغش مسموح</h2>
    <p>أول لعبة تلعبونها مع بعض: كل واحد يختار خانة، وإذا اخترتوا نفس الخانة ينرسم فيها X و O وتنحسب للاثنين.</p>
    <p>اللي يصف ثلاثة رموز ورا بعض يفوز. ومع كل لاعب أربع غشّات، كل وحدة مرة وحدة بالجولة:</p>
    <p>تربّع رمزك (X²) عشان ما ينمسح؛ إذا حاول خصمك يمسحه يروح التربيع بس ويبقى الرمز. ترسم رمزك برا اللوحة عند الزاوية عشان يكمّل القُطر. تمسح رمز خصمك. تسحب عمود وتحطه مكان عمود ثاني.</p>
    <p>الغش ياخذ دورك، وانتبه: التبديل ممكن يفوّز خصمك. وإذا فزتوا مع بعض فهي تعادل.</p>
    <button class="btn primary" @click="close">يلا نلعب</button>
  </dialog>
</template>
