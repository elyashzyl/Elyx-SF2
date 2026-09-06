<template>
  <div class="dropdown-wrapper" ref="wrapperRef">
    <div @click="toggle" class="dropdown-trigger">
      <slot name="trigger" />
    </div>
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="dropdown-content"
        :class="[`dropdown-content--${align}`, contentClass]"
        :style="contentStyle"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  align: { type: String, default: 'start' },
  contentClass: { type: String, default: '' },
  contentStyle: { type: Object, default: () => ({}) }
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

function handleClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    close()
  }
}

function handleEscape(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
  document.removeEventListener('keydown', handleEscape)
})

defineExpose({ close, toggle })
</script>

<style scoped>
.dropdown-wrapper {
  position: relative;
  display: inline-flex;
}

.dropdown-trigger {
  cursor: pointer;
}

.dropdown-content {
  position: absolute;
  top: calc(100% + 6px);
  z-index: 150;
  min-width: 180px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  animation: dropdownIn 0.12s ease-out;
}

.dropdown-content--start {
  left: 0;
}

.dropdown-content--end {
  right: 0;
}

.dropdown-content--center {
  left: 50%;
  transform: translateX(-50%);
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Transition classes */
.dropdown-enter-active {
  animation: dropdownIn 0.12s ease-out;
}

.dropdown-leave-active {
  animation: dropdownIn 0.1s ease-in reverse;
}

/* Dropdown item styles */
:deep(.dropdown-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--foreground);
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  text-decoration: none;
  text-align: left;
}

:deep(.dropdown-item:hover) {
  background: var(--secondary);
  color: var(--foreground);
}

:deep(.dropdown-item--danger) {
  color: var(--destructive);
}

:deep(.dropdown-item--danger:hover) {
  background: rgba(220, 38, 38, 0.08);
  color: var(--destructive);
}

:deep(.dropdown-item .dropdown-item-icon) {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
}

:deep(.dropdown-separator) {
  height: 1px;
  background: var(--border);
  margin: 4px 8px;
}

:deep(.dropdown-label) {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
  opacity: 0.7;
  padding: 6px 12px 4px;
}
</style>
