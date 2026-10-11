<template>
  <Transition name="shadcn-dropdown">
    <div
      v-if="dropdown?.isOpen?.value"
      class="shadcn-dropdown-menu-content"
      :class="[
        `align-${align}`,
        `side-${side}`,
        contentClass
      ]"
      :style="[
        minWidth ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : {},
        contentStyle
      ]"
      role="menu"
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
  minWidth: {
    type: [String, Number],
    default: '180px'
  },
  contentClass: {
    type: String,
    default: ''
  },
  contentStyle: {
    type: Object,
    default: () => ({})
  }
})

const dropdown = inject('dropdownMenu', null)
</script>

<style scoped>
.shadcn-dropdown-menu-content {
  position: absolute;
  z-index: 150;
  background: var(--card);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 8px);
  padding: 4px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  outline: none;
  overflow: hidden;
}

/* Alignment */
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

/* Side placement */
.side-bottom {
  top: calc(100% + 4px);
}
.side-top {
  bottom: calc(100% + 4px);
}

/* Animations */
.shadcn-dropdown-enter-active {
  transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.shadcn-dropdown-leave-active {
  transition: opacity 0.1s ease-in, transform 0.1s ease-in;
}

.shadcn-dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
.shadcn-dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-2px);
}

.align-center.shadcn-dropdown-enter-from {
  transform: translateX(-50%) scale(0.95) translateY(-4px);
}
.align-center.shadcn-dropdown-leave-to {
  transform: translateX(-50%) scale(0.95) translateY(-2px);
}
</style>
