<script lang="ts" setup>
  //
</script>

<template>
  <div aria-hidden="true" class="mesh-bg" />
  <main class="main-bg min-h-screen p-4 flex items-center">
    <router-view />
  </main>
</template>

<style>
  .main-bg {
    background: color-mix(in srgb, var(--v0-background) 85%, transparent);
  }

  .mesh-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(at 40% 20%, color-mix(in srgb, var(--v0-primary) 40%, transparent) 0px, transparent 50%),
      radial-gradient(at 80% 0%, color-mix(in srgb, var(--v0-info) 35%, transparent) 0px, transparent 50%),
      radial-gradient(at 0% 50%, color-mix(in srgb, var(--v0-error) 25%, transparent) 0px, transparent 50%),
      radial-gradient(at 80% 50%, color-mix(in srgb, var(--v0-success) 30%, transparent) 0px, transparent 50%),
      radial-gradient(at 20% 80%, color-mix(in srgb, var(--v0-warning) 20%, transparent) 0px, transparent 50%);
  }
</style>
