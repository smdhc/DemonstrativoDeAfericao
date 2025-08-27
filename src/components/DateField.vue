<template>

<div class="date-picker-theme" :class="{ 'menu-open': isMenuOpen }">
    <VueDatePicker
        v-model="selectedDate"
        month-picker
        model-type="yyyy-MM"
        :format="formatMonth"
        locale="pt-BR"
        :format-locale="formatLocale"
        :min-date="computedMinDate"
        :max-date="computedMaxDate"
        :year-range="computedYearRange"
        :enable-time-picker="false"
        auto-apply
        :placeholder="placeholder"
        :clearable="false"
        :no-overlay="true"
        :teleport="false"
        :prevent-min-max-navigation="true"
        @open="isMenuOpen = true"
        @closed="isMenuOpen = false"
    />
</div>

</template>

<script>

import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'

export default {
    name: 'DateField',
    props: {
        modelValue: { type: String, default: '' },
        minDate: { type: [Date, String, Number], default: null },
        maxDate: { type: [Date, String, Number], default: null },
        placeholder: { type: String, default: '' }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            formatLocale: ptBR,
            isMenuOpen: false
        }
    },
    computed: {
        selectedDate: {
            get() { return this.modelValue },
            set(value) { this.$emit('update:modelValue', value) }
        },
        computedMinDate() {
            return this.coerceMin(this.minDate)
        },
        computedMaxDate() {
            return this.coerceMax(this.maxDate)
        },
        computedYearRange() {
            const minY = this.computedMinDate?.getFullYear?.() ?? 2000
            const maxY = this.computedMaxDate?.getFullYear?.() ?? 2050
            const start = Math.min(minY, maxY)
            const end = Math.max(minY, maxY)
            return [start, end]
        }
    },
    methods: {
        formatMonth(date) {
            if (!date) return ''
            const d = Array.isArray(date) ? date[0] : date
            const str = format(d, 'MMM yy', { locale: ptBR })
            return str.charAt(0).toUpperCase() + str.slice(1)
        },
        toMonthStart(d) {
            return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
        },
        toMonthEnd(d) {
            return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
        },
        parseYearMonthString(str) {
            const m = /^([0-9]{4})-([0-9]{2})$/.exec(String(str))
            if (!m) return null
            const y = Number(m[1])
            const mm = Number(m[2]) - 1
            if (Number.isNaN(y) || Number.isNaN(mm)) return null
            return new Date(y, mm, 1)
        },
        coerceMin(v) {
            if (v === null || v === undefined || v === '') return new Date(2000, 0, 1)
            if (v instanceof Date) return this.toMonthStart(v)
            if (typeof v === 'string') {
                const ym = this.parseYearMonthString(v)
                if (ym) return this.toMonthStart(ym)
                const d = new Date(v)
                if (!Number.isNaN(d)) return this.toMonthStart(d)
            }
            if (typeof v === 'number') {
                const d = new Date(v)
                if (!Number.isNaN(d)) return this.toMonthStart(d)
            }
            return new Date(2000, 0, 1)
        },
        coerceMax(v) {
            if (v === null || v === undefined || v === '') return new Date(2050, 11, 31, 23, 59, 59, 999)
            if (v instanceof Date) return this.toMonthEnd(v)
            if (typeof v === 'string') {
                const ym = this.parseYearMonthString(v)
                if (ym) return this.toMonthEnd(ym)
                const d = new Date(v)
                if (!Number.isNaN(d)) return this.toMonthEnd(d)
            }
            if (typeof v === 'number') {
                const d = new Date(v)
                if (!Number.isNaN(d)) return this.toMonthEnd(d)
            }
            return new Date(2050, 11, 31, 23, 59, 59, 999)
        }
    }
}

</script>

<style scoped>

.date-picker-theme {
    position: relative;
    display: inline-block;
}

/* date picker overwrite */
.date-picker-theme :deep(.dp__theme_light) {
    --dp-background-color: #fff;
    --dp-text-color: #000000;
    --dp-hover-color: #f3f3f3;
    --dp-hover-text-color: #000000;
    --dp-hover-icon-color: #000000;
    --dp-primary-color: lightgrey;
    --dp-primary-text-color: #000000;
    --dp-border-color: lightgrey;
    --dp-menu-border-color: lightgrey;
    --dp-scroll-bar-background: #ffffff;
    --dp-scroll-bar-color: lightgrey;
    --dp-icon-color: #999;
    --dp-tooltip-color: #000000;
    --dp-tooltip-color: #000000;
}

.date-picker-theme :deep(.dp__input) {
    width: 180px;
    height: 40px;
    line-height: 40px;
    padding: 0 10px 0 36px;
    border: 1px solid lightgrey;
    font-size: 16px;
    box-sizing: border-box;
}

.date-picker-theme :deep(.dp__input:hover) {
    border-color: #999;
}

.date-picker-theme :deep(.dp__input:focus),
.date-picker-theme.menu-open :deep(.dp__input) {
    outline: none;
    border-color: #999;
    background-color: #f3f3f3;
}

.date-picker-theme :deep(*) {
    border-radius: 0 !important;
}

.date-picker-theme :deep(.dp__overlay_cell_disabled) {
    display: none !important;
}

.date-picker-theme :deep(.dp__inner_nav.dp__inner_nav_disabled) {
    display: none !important;
}

.date-picker-theme :deep(.dp__btn.dp--year-select) {
    position: absolute !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    max-width: calc(100% - 80px) !important;
}

</style>