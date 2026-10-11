<template>
  <Transition name="shadcn-popover">
    <div
      v-if="popover?.isOpen?.value"
      class="shadcn-popover-content"
      :class="[
        `align-${align}`,
        `side-${side}`,
        customClass
      ]"
      :style="customStyle"
      role="dialog"
      tabindex="-1"
    >
      <slot />
    </div>
  </Transition>
</template>

<script setup>
import { inject } from 'vue'

const props = defineProps({
  align: {
    type: String,
    default: 'start',
    validator: (v) => ['start', 'end', 'center'].includes(v)
  },
  side: {
    type: String,
    default: 'bottom',
    validator: (v) => ['top', 'bottom'].includes(v)
  },
  customClass: {
    type: String,
    default: ''
  },
  customStyle: {
    type: Object,
    default: () => ({})
  }
})

const popover = inject('popoverContext', null)
</script>

<style scoped>
.shadcn-popover-content {
  position: absolute;
  z-index: 200;
  background: var(--card, #ffffff);
  color: var(--foreground, #09090b);
  border: 1px solid var(--border, #e4e4e7);
  border-radius: var(--radius-md, 8px);
  padding: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  outline: none;
}

.align-start {
  left: 0;
}
.align-end {
  right: 0;
}
.align-center {
  left: 50%;
  transform: translateX(-50%);
}

.side-bottom {
  top: calc(100% + 4px);
}
.side-top {
  bottom: calc(100% + 4px);
}

.shadcn-popover-enter-active {
  transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.shadcn-popover-leave-active {
  transition: opacity 0.1s ease-in, transform 0.1s ease-in;
}

.shadcn-popover-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
.shadcn-popover-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-2px);
}

.align-center.shadcn-popover-enter-from {
  transform: translateX(-50%) scale(0.96) translateY(-4px);
}
.align-center.shadcn-popover-leave-to {
  transform: translateX(-50%) scale(0.96) translateY(-2px);
}

:deep(.p-0) {
  padding: 0 !important;
}
</style>
