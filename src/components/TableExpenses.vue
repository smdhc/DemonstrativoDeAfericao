<template>
<div class="my-table">
    <table class="expenses-table">
        <tbody>
            <tr>
                <th></th>
                <th>Rubrica</th>
                <th>Despesa</th>
            </tr>
            <tr v-for="(linha, idx) in linhasTable" :key="'despesa-'+type+'-'+idx"
                    :class="[ { 'row-hovered': isRowHovered(idx) }, { 'dragging-row': draggingIndex === idx }, { 'drag-over-row': dragOverIndex === idx } ]"
                    @mouseenter="handleMouseEnter(idx)"
                    @mouseleave="() => handleRowMouseLeave(idx)"
                    @dragover.prevent="handleDragOver(idx)"
                    @drop.prevent="handleDrop(idx)"
                    @dragend="handleDragEnd"
            >
                <td class="drag-cell"
                    @mouseenter="handleDragIconEnter(idx)"
                    @mouseleave="handleDragIconLeave(idx)"
                >
                        <span
                            v-if="type !== 'rearranged' && idx < linhasTable.length - 1 && (isRowHovered(idx) || dragIconHovered === idx)"
                            class="drag-handle external"
                            draggable="true"
                            @dragstart="handleDragStart(idx, $event)"
                            title="Arraste para mover"
                        >&#9776;</span>
                </td>
                <td :class="{ 'cell-hovered': isCellHovered(idx, 0, 'expenses') }"
                        @mouseenter="handleMouseEnter(idx, 0, 'expenses')"
                        @mouseleave="handleMouseLeave"
                >
                    <div class="select-wrapper" v-if="type !== 'rearranged'">
                            <select
                                    v-model="linhasTable[idx].rubrica"
                                    @change="onInputLinha(idx)"
                                    class="input-table rubrica-select"
                            >
                                    <option value=""></option>
                                    <option value="Recursos Humanos">Recursos Humanos</option>
                                    <option value="Materiais">Materiais</option>
                                    <option value="Administrativas">Administrativas</option>
                                    <option value="Serviços de Terceiros">Serviços de Terceiros</option>
                                    <option value="Outras Despesas">Outras Despesas</option>
                                    <option value="Imobilizado">Imobilizado</option>
                                    <option value="Implantação">Implantação</option>
                            </select>
                            <span class="select-arrow" v-if="!linhasTable[idx].rubrica">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 6L8 10L12 6" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                            </span>
                    </div>
                    <span v-else>{{ linhasTable[idx].rubrica }}</span>
                </td>
                <td :class="{ 'cell-hovered': isCellHovered(idx, 1, 'expenses') }"
                        @mouseenter="handleMouseEnter(idx, 1, 'expenses')"
                        @mouseleave="handleMouseLeave"
                >
                    <input 
                        v-if="type !== 'rearranged'"
                        v-model="linhasTable[idx].despesa" 
                        @input="onInputLinha(idx)" 
                        class="input-table" 
                    />
                    <span v-else>{{ linhasTable[idx].despesa }}</span>
                </td>
            </tr>
            <tr class="total-row-1st">
                <td></td>
                <td colspan="2" class="total-label">Total</td>
            </tr>
        </tbody>
    </table>
  <div class="months-wrapper">
    <table class="months-table">
      <tbody>
        <tr>
          <th v-for="mes in meses" :key="mes">{{ mes }}</th>
        </tr>
        <tr v-for="(linha, idx) in linhasTable" :key="'meses-'+type+'-'+idx"
                :class="[ { 'row-hovered': isRowHovered(idx) }, { 'drag-over-row': dragOverIndex === idx } ]"
            @mouseenter="handleMouseEnter(idx)"
            @mouseleave="handleMouseLeave">
          <td v-for="(mes, mIdx) in meses" :key="'mes-'+type+'-'+mIdx"
              :class="[
                { 'cell-hovered': isCellHovered(idx, mIdx, 'months') },
                getCellColorClass(linha.expenseKey, mes)
              ]"
              @mouseenter="handleMouseEnter(idx, mIdx, 'months')"
              @mouseleave="handleMouseLeave">
            <MoneyTableInput
              v-if="type !== 'rearranged'"
              :model-value="getMesNumericValue(idx, mIdx)"
              :is-last-row="idx === linhasTable.length - 1"
              @update:model-value="(value: number) => handleMesInput(value, idx, mIdx)"
            />
            <span v-else class="value-display">{{ getMesDisplayValue(idx, mIdx) }}</span>
          </td>
        </tr>
        <tr class="total-row">
          <td v-for="(mes, mIdx) in meses" :key="'total-mes-'+mIdx" 
              :class="[
                'total-cell',
                getMonthTotalColorClass(mes, linhasTable, true)
              ]">
            {{ getTotalMes(mIdx) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <table class="total-table">
    <tbody>
      <tr>
        <th>Total</th>
      </tr>
      <tr v-for="(linha, idx) in linhasTable" :key="'total-'+type+'-'+idx"
          :class="[ { 'row-hovered': isRowHovered(idx) }, { 'drag-over-row': dragOverIndex === idx } ]"
          @mouseenter="handleMouseEnter(idx)"
          @mouseleave="handleMouseLeave">
        <td class="total-cell"
            :class="[
              { 'cell-hovered': isCellHovered(idx, 0, 'total') },
              getRowTotalColorClass(linha.expenseKey, meses, true)
            ]"
            @mouseenter="handleMouseEnter(idx, 0, 'total')"
            @mouseleave="handleMouseLeave">
          {{ getTotalLinha(idx) }}
        </td>
      </tr>
      <tr class="total-row">
        <td :class="[
          'total-cell total-label',
          getGeneralTotalColorClass(meses, linhasTable)
        ]">
          {{ getTotalGeral() }}
        </td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script setup lang="ts">

import { computed, reactive, watch, onMounted, ref } from 'vue';
import type { DataFrame } from '../types';
import MoneyTableInput from './MoneyTableInput.vue';
import { useHover } from '../composables/useHover';
import { useTableColors } from '../composables/useTableColors';

interface Props {
    type: 'expected' | 'executed' | 'rearranged';
    df: DataFrame;
}

const props = defineProps<Props>();

const { setHover, clearHover, isRowHovered, isCellHovered } = useHover();
const dragIconHovered = ref<number | null>(null);

const { setDataFrame, getCellColorClass, getMonthTotalColorClass, getRowTotalColorClass, getGeneralTotalColorClass } = useTableColors();

onMounted(() => {
    setDataFrame(props.df);
});

const meses = computed(() => {
    return props.df.getMonthNames();
});

interface LinhaTable {
    rubrica: string;
    despesa: string;
    expenseKey?: string;
}

const linhasTable = reactive<LinhaTable[]>([]);

const draggingIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function handleDragStart(idx: number, event?: DragEvent) {
    draggingIndex.value = idx;
    if (event) {
        event.dataTransfer?.setData('text/plain', idx.toString());
        event.dataTransfer?.setDragImage(event.target as HTMLElement, 10, 10);
    }
}

function handleDragOver(idx: number) {
    if (draggingIndex.value !== null && idx !== draggingIndex.value && idx < linhasTable.length - 1) {
        dragOverIndex.value = idx;
    }
}

function handleDrop(idx: number) {
    if (draggingIndex.value !== null && dragOverIndex.value !== null && draggingIndex.value !== dragOverIndex.value) {
        moveLinha(draggingIndex.value, dragOverIndex.value);
    }
    draggingIndex.value = null;
    dragOverIndex.value = null;
}

function handleDragEnd() {
    draggingIndex.value = null;
    dragOverIndex.value = null;
}

function moveLinha(from: number, to: number) {
    if (from < 0 || to < 0 || from === to || from >= linhasTable.length - 1 || to >= linhasTable.length - 1) return;
    const moved = linhasTable.splice(from, 1)[0];
    linhasTable.splice(to, 0, moved);
}

const createEmptyLinha = (): LinhaTable => ({
    rubrica: '',
    despesa: ''
});

const isLinhaEmpty = (linha: LinhaTable): boolean => {
    return !linha.rubrica.trim() && !linha.despesa.trim();
};

const manageLinhas = (idx: number) => {
    const linha = linhasTable[idx];
    
    if (idx === linhasTable.length - 1 && !isLinhaEmpty(linha)) {
        if (!linha.expenseKey) {
            const newKey = `expense_${Date.now()}`;
            props.df.addExpense(newKey, linha.rubrica, linha.despesa);
            linha.expenseKey = newKey;
        }
        
        linhasTable.push(createEmptyLinha());
    }
    
    for (let i = linhasTable.length - 2; i >= 0; i--) {
        const currentLine = linhasTable[i];
        if (isLinhaEmpty(currentLine)) {
            if (currentLine.expenseKey) {
                props.df.removeExpense(currentLine.expenseKey);
            }
            linhasTable.splice(i, 1);
        }
    }
};

const onInputLinha = (idx: number) => {
    const linha = linhasTable[idx];
    
    if (linha.expenseKey) {
        props.df.setExpenseData(linha.expenseKey, linha.rubrica, linha.despesa);
    }
    
    manageLinhas(idx);
};

const getMesNumericValue = (idx: number, mIdx: number): number => {
    const linha = linhasTable[idx];
    if (!linha.expenseKey || idx === linhasTable.length - 1) return 0;
    
    const mes = meses.value[mIdx];
    let value: number | undefined;
    
    switch (props.type) {
        case 'expected':
            value = props.df.getPredicted(linha.expenseKey, mes);
            break;
        case 'executed':
            value = props.df.getExecuted(linha.expenseKey, mes);
            break;
        case 'rearranged':
            value = props.df.getRearranged(linha.expenseKey, mes);
            break;
    }
    
    return value ? (value / 100) : 0;
};

const getMesDisplayValue = (idx: number, mIdx: number): string => {
    const linha = linhasTable[idx];
    if (!linha.expenseKey || idx === linhasTable.length - 1) return '';
    
    const mes = meses.value[mIdx];
    let value: number | undefined;
    
    switch (props.type) {
        case 'expected':
            value = props.df.getPredicted(linha.expenseKey, mes);
            break;
        case 'executed':
            value = props.df.getExecuted(linha.expenseKey, mes);
            break;
        case 'rearranged':
            value = props.df.getRearranged(linha.expenseKey, mes);
            break;
    }
    
    if (props.type === 'rearranged') {
        const percentValue = value ? (value * 100 / 100) : 0;
        return percentValue.toFixed(2).replace('.', ',') + '%';
    } else {
        const numericValue = value ? (value / 100) : 0;
        return 'R$ ' + numericValue.toFixed(2).replace('.', ',');
    }
};

const handleMesInput = (value: number, idx: number, mIdx: number) => {
    const linha = linhasTable[idx];
    if (!linha.expenseKey) return;
    
    const centavos = Math.round(value * 100);
    const mes = meses.value[mIdx];
    
    switch (props.type) {
        case 'expected':
            props.df.setPredicted(linha.expenseKey, mes, centavos);
            break;
        case 'executed':
            props.df.setExecuted(linha.expenseKey, mes, centavos);
            break;
    }
};

const getTotalLinha = (idx: number): string => {
    const linha = linhasTable[idx];
    if (!linha.expenseKey || idx === linhasTable.length - 1) return '';
    
    let total = 0;
    meses.value.forEach(mes => {
        let value: number | undefined;
        
        switch (props.type) {
            case 'expected':
                value = props.df.getPredicted(linha.expenseKey!, mes);
                break;
            case 'executed':
                value = props.df.getExecuted(linha.expenseKey!, mes);
                break;
            case 'rearranged':
                value = props.df.getRearranged(linha.expenseKey!, mes);
                break;
        }
        
        if (value) total += value;
    });
    
    if (props.type === 'rearranged') {
        const percentTotal = (total * 100 / 100);
        return percentTotal.toFixed(2).replace('.', ',') + '%';
    } else {
        return 'R$ ' + (total / 100).toFixed(2).replace('.', ',');
    }
};

const getTotalMes = (mIdx: number): string => {
    const mes = meses.value[mIdx];
    let total = 0;
    
    for (let i = 0; i < linhasTable.length - 1; i++) {
        const linha = linhasTable[i];
        if (linha.expenseKey) {
            let value: number | undefined;
            
            switch (props.type) {
                case 'expected':
                    value = props.df.getPredicted(linha.expenseKey, mes);
                    break;
                case 'executed':
                    value = props.df.getExecuted(linha.expenseKey, mes);
                    break;
                case 'rearranged':
                    value = props.df.getRearranged(linha.expenseKey, mes);
                    break;
            }
            
            if (value) total += value;
        }
    }
    
    if (props.type === 'rearranged') {
        const percentTotal = (total * 100 / 100);
        return percentTotal.toFixed(2).replace('.', ',') + '%';
    } else {
        return 'R$ ' + (total / 100).toFixed(2).replace('.', ',');
    }
};

const getTotalGeral = (): string => {
    let total = 0;
    
    for (let i = 0; i < linhasTable.length - 1; i++) {
        const linha = linhasTable[i];
        if (linha.expenseKey) {
            meses.value.forEach(mes => {
                let value: number | undefined;
                
                switch (props.type) {
                    case 'expected':
                        value = props.df.getPredicted(linha.expenseKey!, mes);
                        break;
                    case 'executed':
                        value = props.df.getExecuted(linha.expenseKey!, mes);
                        break;
                    case 'rearranged':
                        value = props.df.getRearranged(linha.expenseKey!, mes);
                        break;
                }
                
                if (value) total += value;
            });
        }
    }
    
    if (props.type === 'rearranged') {
        const percentTotal = (total * 100 / 100);
        return percentTotal.toFixed(2).replace('.', ',') + '%';
    } else {
        return 'R$ ' + (total / 100).toFixed(2).replace('.', ',');
    }
};

// Funções de hover
function handleRowMouseLeave(idx: number) {
    if (dragIconHovered.value !== idx) {
        clearHover();
        dragIconHovered.value = null;
    }
}

const handleMouseEnter = (rowIndex: number, cellIndex: number | null = null, tableType: 'expenses' | 'months' | 'total' | null = null) => {
    setHover(rowIndex, cellIndex, tableType);
    dragIconHovered.value = null;
};

const handleMouseLeave = () => {
    if (dragIconHovered.value === null) {
        clearHover();
    }
};

const handleDragIconEnter = (idx: number) => {
    dragIconHovered.value = idx;
    setHover(idx);
};

const handleDragIconLeave = (idx: number) => {
    dragIconHovered.value = null;
    clearHover();
};

watch(() => props.df.getAllExpenses(), (newExpenses) => {
    linhasTable.splice(0, linhasTable.length);
    
    Object.entries(newExpenses).forEach(([key, value]) => {
        linhasTable.push({
            rubrica: value.rubrica,
            despesa: value.despesa,
            expenseKey: key
        });
    });
    
    if (linhasTable.length === 0 || !isLinhaEmpty(linhasTable[linhasTable.length - 1])) {
        linhasTable.push(createEmptyLinha());
    }
}, { immediate: true, deep: true });

</script>

<style scoped>
.expenses-table {
    table-layout: fixed;
}
.expenses-table th:first-child,
.expenses-table td.drag-cell {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    width: 30px !important;
    min-width: 30px !important;
    max-width: 30px !important;
    padding: 0 !important;
    overflow: hidden !important;
}
.expenses-table-outer {
    display: block;
    position: relative;
}
.drag-cell {
    text-align: center;
    background: transparent;
    border: none;
}
.table-row-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 0px;
}
.single-row-table {
    margin-bottom: 0px;
}
.drag-handle.external {
    margin-right: 8px;
    margin-left: 0;
    position: relative;
    left: 0;
    top: 0;
    z-index: 2;
}
.drag-handle {
    font-size: 18px;
    vertical-align: middle;
    user-select: none;
    cursor: grab;
}

.dragging-row {
    opacity: 0.5;
}
.drag-over-row {
    border-top: 2px solid #999;
}
.my-table {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    align-items: flex-start;
}
table {
    border-collapse: collapse;
}

.expenses-table th:nth-child(2),
.expenses-table td:nth-child(2),
.expenses-table th:nth-child(3),
.expenses-table td:nth-child(3) {
    width: 150px !important;
    min-width: 150px !important;
    max-width: 150px !important;
}

.months-table th, .months-table td {
    width: 100px;
}
.total-table th, .total-table td {
    width: 120px;
}

table th, table td {
    border: 1px solid #999;
    padding: 4px;
    height: 30px;
}
table th {
    background-color: lightgrey;
    text-align: center;
    padding: 4px;
}
.expenses-table td, .total-table td {
    background-color: #ececec;
}

.input-table {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 4px;
    height: 30px;
    box-sizing: border-box;
    margin: 0;
    border-radius: 0;
    appearance: none;
    display: block;
}

.select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}
.rubrica-select {
    cursor: pointer;
    padding-right: 24px;
}
.select-arrow {
    position: absolute;
    right: 8px;
    pointer-events: none;
    display: flex;
    align-items: center;
    height: 100%;
}
.rubrica-select:hover {
    cursor: pointer;
}
.input-right {
    text-align: right;
}
.value-display {
    display: block;
    width: 100%;
    text-align: right;
    padding: 2px;
    height: 100%;
    box-sizing: border-box;
    line-height: 22px;
}
.total-cell {
    text-align: right;
    font-weight: bold;
    vertical-align: middle;
    height: 30px;
}

.total-row {
    background-color: #ececec !important;
    font-weight: bold;
}

.total-row-1st td:first-child {
    background-color: transparent !important;
    border: none !important;
}

.total-row td {
    background-color: #ececec !important;
    text-align: center;
    font-weight: bold;
    vertical-align: middle;
    padding: 4px;
}

.total-label {
    text-align: center !important;
    background-color: #ececec !important;
    font-weight: bold;
    vertical-align: middle;
    padding: 4px;
}

.total-row .total-cell {
    background-color: #ececec !important;
    text-align: right;
    font-weight: bold;
    vertical-align: middle;
    padding: 4px;
}

.total-row .total-cell.cell-red-total,
.total-label.cell-red-total {
    background-color: #ffcdd2 !important;
}

.total-row .total-cell.cell-blue-total,
.total-label.cell-blue-total {
    background-color: #bbdefb !important;
}

.total-row .total-cell.cell-red-total.cell-hovered,
.total-row .total-cell.cell-red-total:hover,
.total-label.cell-red-total.cell-hovered,
.total-label.cell-red-total:hover {
    background-color: #ef9a9a !important;
    box-shadow: inset 0 0 0 1000px rgba(244, 67, 54, 0.12) !important;
}

.total-row .total-cell.cell-blue-total.cell-hovered,
.total-row .total-cell.cell-blue-total:hover,
.total-label.cell-blue-total.cell-hovered,
.total-label.cell-blue-total:hover {
    background-color: #90caf9 !important;
    box-shadow: inset 0 0 0 1000px rgba(33, 150, 243, 0.12) !important;
}

.months-table th:first-child,
.months-table td:first-child {
    border-left: none;
}
.months-table th:last-child,
.months-table td:last-child {
    border-right: none;
}

.expenses-table,
.total-table {
    flex: 0 0 auto;
}
.months-wrapper {
    overflow-y: hidden;
    scrollbar-width: thin;
}
.months-table {
    width: max-content;
    table-layout: fixed;
}

.row-hovered td {
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, 0.1) !important;
}

.cell-hovered {
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, 0.2) !important;
}

.months-table .cell-hovered {
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, 0.2) !important;
}

td:focus-within,
.input-table:focus,
.money-table-input:focus {
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, 0.1) !important;
}

.cell-red {
    background-color: #ffe1e3 !important; 
}

.cell-red-total {
    background-color: #ffcdd2 !important; 
}

.cell-blue {
    background-color: #e8f4fd !important;
}

.cell-blue-total {
    background-color: #bbdefb !important;
}

.cell-red.cell-hovered,
.cell-red:hover {
    background-color: #ffcdd2 !important;
    box-shadow: inset 0 0 0 1000px rgba(244, 67, 54, 0.08) !important;
}

.cell-red-total.cell-hovered,
.cell-red-total:hover {
    background-color: #ef9a9a !important;
    box-shadow: inset 0 0 0 1000px rgba(244, 67, 54, 0.12) !important;
}

.cell-blue.cell-hovered,
.cell-blue:hover {
    background-color: #bbdefb !important;
    box-shadow: inset 0 0 0 1000px rgba(33, 150, 243, 0.08) !important;
}

.cell-blue-total.cell-hovered,
.cell-blue-total:hover {
    background-color: #90caf9 !important;
    box-shadow: inset 0 0 0 1000px rgba(33, 150, 243, 0.12) !important;
}
</style>
