<template>
    <div class="input-field-theme">
        <input
            ref="inputRef"
            v-model="inputValue"
            :type="type"
            :placeholder="placeholder"
            :maxlength="maxlength"
            class="input-field"
            :style="inputStyle"
            @input="emitValue"
            @focus="handleFocus"
            @blur="handleBlur"
        />
    </div>
</template>

<script>
export default {
    name: 'InputField',
    props: {
        modelValue: { type: [String, Number], default: '' },
        type: { type: String, default: 'text' },
        placeholder: { type: String, default: '' },
        maxlength: { type: [Number, String], default: null }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            inputValue: this.modelValue,
            isFocused: false
        }
    },
    computed: {
        inputStyle() {
            let width = '180px';
            if (this.maxlength) {
                const charWidth = 0.6 * 16; 
                const padding = 20;
                width = `${Math.ceil(parseInt(this.maxlength) * charWidth + padding)}px`;
            }
            return { width };
        }
    },
    watch: {
        modelValue(newVal) {
            if (!this.isFocused) {
                this.inputValue = newVal
            }
        }
    },
    methods: {
        emitValue() {
            this.$emit('update:modelValue', this.inputValue)
        },
        handleFocus() {
            this.isFocused = true
        },
        handleBlur() {
            this.isFocused = false
        }
    }
}
</script>

<style scoped>
.input-field-theme {
    position: relative;
    display: inline-block;
}
.input-field {
    height: 40px;
    line-height: 40px;
    padding: 0 10px;
    border: 1px solid lightgrey;
    border-radius: 0;
    font-size: 16px;
    box-sizing: border-box;
    background-color: #fff;
    color: #000000;
    text-align: left;
}
.input-field:hover {
    border-color: #999;
}
.input-field:focus {
    outline: none;
    border-color: #999;
    background-color: #f3f3f3;
}
.input-field::placeholder {
    color: #999;
    opacity: 1;
}
</style>
