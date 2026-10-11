<template>
  <div class="shadcn-dropdown-menu" ref="menuRef">
    <slot />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: undefined
  }
})

const emit = defineEmits(['update:modelValue', 'open', 'close'])

const internalOpen = ref(false)
const menuRef = ref(null)

const isOpen = ref(false)

function toggle() {
  setOpen(!isOpen.value)
}

function setOpen(val) {
  isOpen.value = val
  internalOpen.value = val
  emit('update:modelValue', val)
  emit(val ? 'open' : 'close')
}

function close() {
  if (isOpen.value) setOpen(false)
}

function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
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
.shadcn-dropdown-menu {
  position: relative;
  display: inline-flex;
}
</style>
