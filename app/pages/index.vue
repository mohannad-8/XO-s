<script setup lang="ts">
useHead({ title: 'XO؟ — القائمة' })
</script>

<template>
  <div class="screen">
    <h1>XO؟</h1>
    <p>لعبة XO عادية ظاهريًا... إلا أن الغش فيها مسموح. اختر طريقة اللعب:</p>

    <div class="menu-list">
      <NuxtLink class="mode-card" to="/play?mode=surprise">
        <strong>ضد الجهاز</strong>
        <span>تبدأ عادية، وفي مكان ما بالجولة الجهاز بيغش... وبعدها تصير القواعد بين الكل.</span>
      </NuxtLink>

      <NuxtLink class="mode-card" to="/play?mode=local">
        <strong>لاعبين على نفس الجهاز</strong>
        <span>ضعوا الهاتف بينكم وجهًا لوجه، وكل واحد يغش متى قدر.</span>
      </NuxtLink>

      <NuxtLink class="mode-card" to="/online">
        <strong>أونلاين مع صديق</strong>
        <span>أنشئ غرفة أو ادخل بكود، وغرفتك تتحمّل لاعبين فقط.</span>
      </NuxtLink>
    </div>

    <NuxtLink class="back-link" to="/credits">الاعتمادات</NuxtLink>
  </div>
</template>
