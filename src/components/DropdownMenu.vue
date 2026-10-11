<template>
  <div class="shadcn-dropdown-wrapper" ref="wrapperRef">
    <div
      class="shadcn-dropdown-trigger"
      @click="toggle"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-haspopup="menu"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <slot name="trigger" :isOpen="isOpen" :toggle="toggle">
        <button type="button" class="btn-secondary btn-sm default-trigger-btn">
          <span>{{ label || 'Options' }}</span>
          <svg class="chevron-icon" :class="{ 'is-open': isOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </slot>
    </div>

    <Transition name="shadcn-dropdown">
      <div
        v-if="isOpen"
        class="shadcn-dropdown-content"
        :class="[`align-${align}`, `side-${side}`, contentClass]"
        :style="[
          minWidth ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : {},
          contentStyle
        ]"
        role="menu"
      >
        <slot :close="close" :isOpen="isOpen" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onBeforeUnmount } from 'vue'

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
  label: {
    type: String,
    default: ''
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

const emit = defineEmits(['open', 'close'])

const isOpen = ref(false)
const wrapperRef = ref(null)

function toggle() {
  isOpen.value = !isOpen.value
  emit(isOpen.value ? 'open' : 'close')
}

function close() {
  if (isOpen.value) {
    isOpen.value = false
    emit('close')
  }
}

function open() {
  if (!isOpen.value) {
    isOpen.value = true
    emit('open')
  }
}

function handleClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    close()
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
  document.removeEventListener('keydown', handleKeyDown)
})

provide('dropdownMenu', {
  isOpen,
  toggle,
  close,
  open
})

defineExpose({
  isOpen,
  toggle,
  close,
  open
})
</script>

<style scoped>
.shadcn-dropdown-wrapper {
  position: relative;
  display: inline-flex;
}

.shadcn-dropdown-trigger {
  outline: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.default-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chevron-icon {
  transition: transform 0.15s ease;
}
.chevron-icon.is-open {
  transform: rotate(180deg);
}

.shadcn-dropdown-content {
  position: absolute;
  z-index: 160;
  background: var(--card);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 8px);
  padding: 4px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
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

/* Deep item styles inside content */
:deep(.shadcn-dropdown-item),
:deep(.dropdown-item) {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-sm, 6px);
  padding: 7px 10px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--foreground);
  user-select: none;
  cursor: pointer;
  outline: none;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  text-decoration: none;
  transition: background-color 0.12s ease, color 0.12s ease;
}

:deep(.shadcn-dropdown-item:hover),
:deep(.dropdown-item:hover),
:deep(.shadcn-dropdown-item:focus-visible),
:deep(.dropdown-item:focus-visible) {
  background: var(--secondary, rgba(255, 255, 255, 0.08));
  color: var(--foreground);
}

:deep(.shadcn-dropdown-item.is-active),
:deep(.dropdown-item.is-active) {
  background: var(--primary-bg, rgba(12, 83, 87, 0.12));
  color: var(--primary);
  font-weight: 700;
}

:deep(.shadcn-dropdown-item.is-destructive),
:deep(.dropdown-item.dropdown-item--danger) {
  color: var(--destructive, #ef4444);
}
:deep(.shadcn-dropdown-item.is-destructive:hover),
:deep(.dropdown-item.dropdown-item--danger:hover) {
  background: var(--red-bg, rgba(239, 68, 68, 0.1));
  color: var(--destructive, #ef4444);
}

:deep(.shadcn-dropdown-separator),
:deep(.dropdown-separator) {
  height: 1px;
  background: var(--border);
  margin: 4px -4px;
}

:deep(.shadcn-dropdown-label),
:deep(.dropdown-label) {
  padding: 6px 10px 4px;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  user-select: none;
}
</style>
