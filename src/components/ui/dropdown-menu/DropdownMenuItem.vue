<template>
  <div
    class="shadcn-dropdown-menu-item"
    :class="{
      'is-disabled': disabled,
      'is-destructive': variant === 'destructive',
      'is-active': active
    }"
    role="menuitem"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="handleClick"
    tabindex="0"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <span v-if="$slots.icon" class="item-icon">
      <slot name="icon" />
    </span>
    <span class="item-content">
      <slot />
    </span>
    <span v-if="$slots.shortcut" class="item-shortcut">
      <slot name="shortcut" />
    </span>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'destructive'].includes(v)
  },
  active: {
    type: Boolean,
    default: false
  },
  closeOnSelect: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])
const dropdown = inject('dropdownMenu', null)

function handleClick(e) {
  if (props.disabled) return
  emit('click', e)
  if (props.closeOnSelect && dropdown) {
    dropdown.close()
  }
}
</script>

<style scoped>
.shadcn-dropdown-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-sm, 6px);
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--foreground);
  user-select: none;
  cursor: pointer;
  outline: none;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.shadcn-dropdown-menu-item:hover,
.shadcn-dropdown-menu-item:focus-visible {
  background: var(--secondary, rgba(255, 255, 255, 0.08));
  color: var(--foreground);
}

.shadcn-dropdown-menu-item.is-active {
  background: var(--primary-bg, rgba(12, 83, 87, 0.12));
  color: var(--primary);
  font-weight: 700;
}

.shadcn-dropdown-menu-item.is-destructive {
  color: var(--destructive, #ef4444);
}
.shadcn-dropdown-menu-item.is-destructive:hover,
.shadcn-dropdown-menu-item.is-destructive:focus-visible {
  background: var(--red-bg, rgba(239, 68, 68, 0.1));
  color: var(--destructive, #ef4444);
}

.shadcn-dropdown-menu-item.is-disabled {
  opacity: 0.45;
  pointer-events: none;
  cursor: not-allowed;
}

.item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: currentColor;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-shortcut {
  margin-left: auto;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
}
</style>
