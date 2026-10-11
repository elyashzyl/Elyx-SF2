<template>
  <div
    class="shadcn-dropdown-menu-trigger"
    :class="{ 'is-open': dropdown?.isOpen?.value, disabled: disabled }"
    @click="handleClick"
    :aria-expanded="dropdown?.isOpen?.value ? 'true' : 'false'"
    aria-haspopup="menu"
    role="button"
    tabindex="0"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <slot />
  </div>
</template>

<script setup>
import { inject } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const dropdown = inject('dropdownMenu', null)

function handleClick(e) {
  if (props.disabled) return
  if (dropdown) {
    dropdown.toggle()
  }
}
</script>

<style scoped>
.shadcn-dropdown-menu-trigger {
  display: inline-flex;
  align-items: center;
  outline: none;
  cursor: pointer;
  user-select: none;
}
.shadcn-dropdown-menu-trigger.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>
