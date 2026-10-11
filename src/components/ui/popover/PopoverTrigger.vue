<template>
  <div
    class="shadcn-popover-trigger"
    :class="{ 'is-open': popover?.isOpen?.value, disabled: disabled }"
    @click="handleClick"
    :aria-expanded="popover?.isOpen?.value ? 'true' : 'false'"
    aria-haspopup="dialog"
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
  },
  asChild: {
    type: Boolean,
    default: false
  }
})

const popover = inject('popoverContext', null)

function handleClick() {
  if (props.disabled) return
  if (popover) {
    popover.toggle()
  }
}
</script>

<style scoped>
.shadcn-popover-trigger {
  display: inline-flex;
  align-items: center;
  outline: none;
  cursor: pointer;
  user-select: none;
}
.shadcn-popover-trigger.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>
