<template>
  <div>
    <NuxtRouteAnnouncer />
    <!-- 全局纸纹颗粒覆盖层 -->
    <div class="grain-overlay" aria-hidden="true" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style scoped>
/* 全局颗粒覆盖：模拟宣纸的微观颗粒感，悬浮于所有内容之上但不阻挡点击 */
.grain-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.15 0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
.dark .grain-overlay {
  mix-blend-mode: screen;
  opacity: 0.18;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.9 0 0 0 0 0.75 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E");
}
</style>
