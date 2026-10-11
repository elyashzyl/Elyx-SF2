<template>
  <div class="shadcn-dropdown-menu-label">
    <slot />
  </div>
</template>

<style scoped>
.shadcn-dropdown-menu-label {
  padding: 6px 10px 4px;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  user-select: none;
}
</style>
