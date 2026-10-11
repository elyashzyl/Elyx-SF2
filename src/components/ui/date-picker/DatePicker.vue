<template>
  <div
    class="shadcn-date-picker"
    :class="{
      'is-disabled': disabled,
      'full-width': fullWidth
    }"
  >
    <Popover ref="popoverRef" :disabled="disabled" v-model:open="isOpen">
      <PopoverTrigger as-child :disabled="disabled">
        <button
          type="button"
          :id="id"
          class="shadcn-date-picker-trigger"
          :class="[
            inputClass,
            {
              'is-empty': !modelValue,
              'is-open': isOpen,
              'is-disabled': disabled
            }
          ]"
          :disabled="disabled"
          :aria-label="ariaLabel || placeholder"
          :aria-expanded="isOpen ? 'true' : 'false'"
          aria-haspopup="dialog"
        >
          <svg class="calendar-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>

          <span class="date-picker-label">
            {{ displayLabel || placeholder }}
          </span>

          <span
            v-if="clearable && modelValue && !disabled"
            class="clear-btn-wrap"
            title="Clear date"
            aria-label="Clear date"
            role="button"
            tabindex="0"
            @click.stop.prevent="handleClear"
            @keydown.enter.stop.prevent="handleClear"
            @keydown.space.stop.prevent="handleClear"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent :align="align" :side="side" custom-class="p-0">
        <Calendar
          :model-value="modelValue"
          :min="min"
          :max="max"
          :show-quick-buttons="showQuickButtons"
          @update:model-value="handleDateSelect"
          @clear="handleClear"
        />
      </PopoverContent>
    </Popover>

    <!-- Hidden input for standard HTML forms -->
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="modelValue"
      :required="required"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Popover from '../popover/Popover.vue'
import PopoverTrigger from '../popover/PopoverTrigger.vue'
import PopoverContent from '../popover/PopoverContent.vue'
import Calendar from '../calendar/Calendar.vue'

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Pick a date'
  },
  min: {
    type: [String, Date],
    default: ''
  },
  max: {
    type: [String, Date],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  align: {
    type: String,
    default: 'start'
  },
  side: {
    type: String,
    default: 'bottom'
  },
  id: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  inputClass: {
    type: String,
    default: ''
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  showQuickButtons: {
    type: Boolean,
    default: true
  },
  format: {
    type: [String, Function],
    default: 'readable'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'clear'])

const popoverRef = ref(null)
const isOpen = ref(false)

function parseIso(val) {
  if (!val) return null
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : new Date(val.getFullYear(), val.getMonth(), val.getDate())
  }
  if (typeof val === 'string') {
    const parts = val.trim().split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day)
      }
    }
    const d = new Date(val)
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
  }
  return null
}

const displayLabel = computed(() => {
  if (!props.modelValue) return ''
  if (typeof props.format === 'function') {
    return props.format(props.modelValue)
  }
  if (props.format === 'iso') {
    return String(props.modelValue)
  }
  const d = parseIso(props.modelValue)
  if (!d) return String(props.modelValue)

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
})

function handleDateSelect(val) {
  emit('update:modelValue', val)
  emit('change', val)
  if (popoverRef.value?.close) {
    popoverRef.value.close()
  } else {
    isOpen.value = false
  }
}

function handleClear() {
  emit('update:modelValue', '')
  emit('change', '')
  emit('clear')
}

defineExpose({
  open: () => popoverRef.value?.setOpen?.(true),
  close: () => popoverRef.value?.close?.(),
  handleClear
})
</script>

<style scoped>
.shadcn-date-picker {
  display: inline-flex;
  vertical-align: middle;
}

.shadcn-date-picker.full-width {
  display: flex;
  width: 100%;
}

.shadcn-date-picker.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.shadcn-date-picker-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--border, #e4e4e7);
  background: var(--card, #ffffff);
  color: var(--foreground, #09090b);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  outline: none;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  min-width: 140px;
}

.shadcn-date-picker.full-width .shadcn-date-picker-trigger {
  width: 100%;
}

.shadcn-date-picker-trigger:hover:not(:disabled) {
  background: var(--secondary, rgba(255, 255, 255, 0.05));
  border-color: var(--primary, #0c5357);
}

.shadcn-date-picker-trigger:focus-visible,
.shadcn-date-picker-trigger.is-open {
  border-color: var(--primary, #0c5357);
  box-shadow: 0 0 0 2px var(--primary-bg, rgba(12, 83, 87, 0.2));
}

.shadcn-date-picker-trigger.is-empty {
  color: var(--muted-foreground, #71717a);
  font-weight: 400;
}

.calendar-icon {
  flex-shrink: 0;
  color: var(--muted-foreground, #71717a);
  transition: color 0.15s ease;
}

.shadcn-date-picker-trigger:hover .calendar-icon,
.shadcn-date-picker-trigger.is-open .calendar-icon {
  color: var(--primary, #0c5357);
}

.date-picker-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clear-btn-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  color: var(--muted-foreground, #a1a1aa);
  transition: background 0.12s ease, color 0.12s ease;
  cursor: pointer;
}

.clear-btn-wrap:hover {
  background: var(--muted, rgba(0, 0, 0, 0.08));
  color: var(--destructive, #ef4444);
}
</style>
