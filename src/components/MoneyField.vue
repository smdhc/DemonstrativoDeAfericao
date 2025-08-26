<template>

<div class="money-field-theme">
    <input
        ref="moneyInput"
        v-model="displayValue"
        type="text"
        :placeholder="placeholder"
        class="money-input"
        readonly
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
    />
</div>

</template>

<script>
import { useMoneyInput } from '../utils/moneyUtils'

export default {
    name: 'MoneyField',
    props: {
        modelValue: { type: [String, Number], default: 0 },
        placeholder: { type: String, default: 'R$ 0,00' },
        prefix: { type: String, default: 'R$ ' },
        disabled: { type: Boolean, default: false },
        max: { type: Number, default: 99999999.99 },
        min: { type: Number, default: 0 }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            moneyManager: null
        }
    },
    computed: {
        displayValue() {
            return this.moneyManager ? this.moneyManager.getDisplayValue() : ''
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
        const { manager } = useMoneyInput(this.modelValue, this.prefix, this.max, this.min)
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

<style scoped>

.money-field-theme {
    position: relative;
    display: inline-block;
}

.money-input {
    width: 180px;
    height: 40px;
    line-height: 40px;
    padding: 0 10px;
    border: 1px solid lightgrey;
    border-radius: 0;
    font-size: 16px;
    box-sizing: border-box;
    background-color: #fff;
    color: #000000;
    text-align: right;
}

.money-input:hover {
    border-color: #999;
}

.money-input:focus {
    outline: none;
    border-color: #999;
    background-color: #f3f3f3;
}

.money-input::placeholder {
    color: #999;
    opacity: 1;
}

</style>