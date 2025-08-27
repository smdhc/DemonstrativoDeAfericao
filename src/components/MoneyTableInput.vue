<template>
  <input
    ref="moneyInput"
    :value="displayValue"
    type="text"
    class="input-table input-right money-table-input"
    readonly
    @keydown="handleKeydown"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script>
import { useMoneyInput } from '../utils/moneyUtils'

export default {
  name: 'MoneyTableInput',
  props: {
    modelValue: { type: [String, Number], default: 0 },
    disabled: { type: Boolean, default: false },
    max: { type: Number, default: 99999999.99 },
    min: { type: Number, default: 0 },
    isLastRow: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      moneyManager: null
    }
  },
  computed: {
    displayValue() {
      if (!this.moneyManager) return ''
      
      if (this.isLastRow) return ''
      
      const value = this.moneyManager.getDisplayValue()
      
      if (!value && !this.moneyManager.isFocused()) {
        return 'R$ 0,00'
      }
      
      if (value && !value.startsWith('R$')) {
        return 'R$ ' + value
      }
      
      return value
    }
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (this.moneyManager && !this.moneyManager.isFocused()) {
          this.moneyManager.setValue(newValue)
        }
      },
      immediate: false
    }
  },
  created() {
    const { manager } = useMoneyInput(this.modelValue, 'R$ ', this.max, this.min)
    this.moneyManager = manager
  },
  methods: {
    handleKeydown(event) {
      if (this.disabled) {
        event.preventDefault()
        return
      }

      const { handled, shouldEmit } = this.moneyManager.handleKeydown(event)
      
      if (shouldEmit) {
        this.emitValue()
      }
    },
    emitValue() {
      const value = this.moneyManager.getValue()
      this.$emit('update:modelValue', value)
    },
    handleFocus(event) {
      this.moneyManager.setFocused(true)
      this.$nextTick(() => {
        const input = event.target
        input.setSelectionRange(input.value.length, input.value.length)
      })
    },
    handleBlur() {
      this.moneyManager.setFocused(false)
    }
  }
}
</script>