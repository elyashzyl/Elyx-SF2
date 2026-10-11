<template>
  <div class="shadcn-popover-root" ref="popoverRef">
    <slot />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: undefined
  }
})

const emit = defineEmits(['update:open', 'open', 'close'])

const isOpen = ref(false)
const popoverRef = ref(null)

function toggle() {
  setOpen(!isOpen.value)
}

function setOpen(val) {
  isOpen.value = val
  emit('update:open', val)
  emit(val ? 'open' : 'close')
}

function close() {
  if (isOpen.value) setOpen(false)
}

function handleClickOutside(e) {
  if (popoverRef.value && !popoverRef.value.contains(e.target)) {
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

provide('popoverContext', {
  isOpen,
  toggle,
  close,
  setOpen
})

defineExpose({
  isOpen,
  toggle,
  close,
  setOpen
})
</script>

<style scoped>
.shadcn-popover-root {
  position: relative;
  display: inline-flex;
}
</style>
