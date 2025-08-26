<template>

<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
    <h1>Demonstrativo de Aferição</h1>
</div>

<div class="container">

    <h2>Informações</h2>
    <div class="input-fields">
        <InputField
            v-model="nomeOSC"
            placeholder="Nome da OSC"
            maxlength=75
        />
        <InputField
            v-model="nomeProjeto"
            placeholder="Nome do projeto"
            maxlength=75
        />
        <InputField
            v-model="termoProjeto"
            placeholder="Termo do projeto"
            maxlength=25
        />
    </div>

    <div class="info-fields">

        <div class="date-fields">
            <DateField
            v-model="dataInicio"
            placeholder="Data de Início"
            :maxDate="dataTermino"
            />

            <DateField
            v-model="dataTermino"
            placeholder="Data de Termino"
            :minDate="dataInicio"
            />
        </div>

        <div class="money-fields">
            <MoneyField
            v-model="valorInicial"
            placeholder="R$          Valor Previsto"
            />

            <MoneyField
            v-model="rendimentos"
            placeholder= "R$           Rendimentos"
            />
        </div>

    </div>

</div>


<div class="container">

    <h2>Gastos Previstos</h2>

    <TableExpenses 
        type="expected"
        :df="dataFrame"
    />

</div>

<div class="container">

    <h2>Gastos Executados</h2>


<ConfirmModal
    :show="showModal"
    title="Confirmar ação"
    message="Todos os valores da tabela 'Gastos Executados' serão sobrescritos pelos valores da tabela 'Gastos Previstos'. Deseja continuar?"
    confirmText="Continuar"
    cancelText="Cancelar"
    @confirm="confirmarCopia"
    @cancel="cancelarCopia"
/>

<ConfirmModal
    :show="showModalLimpar"
    title="Limpar todas as informações"
    message="Esta ação irá apagar todas as informações do demonstrativo. Deseja realmente limpar tudo?"
    confirmText="Limpar"
    cancelText="Cancelar"
    @confirm="confirmarLimpar"
    @cancel="cancelarLimpar"
/>

                <div>
                    <TableExpenses 
                        type="executed"
                        :df="dataFrame"
                    />
                    <div style="margin-top: 12px; text-align: right;">
                        <button @click="abrirModalCopia">Copiar Gastos Previstos</button>
                    </div>
                </div>

</div>


<div class="container">
    <h2>Remanejamento Percentual</h2>
    <TableExpenses 
        type="rearranged"
        :df="dataFrame"
    />
</div>

<div class="action-buttons-container">
    <button class="action-btn" @click="abrirModalLimpar">Limpar Dados</button>
    <button class="action-btn" @click="exportarPDF">Exportar PDF</button>
    <input ref="pdfInput" type="file" accept="application/pdf" style="display:none" @change="onPDFImport" />
    <button class="action-btn" type="button" @click="abrirImportarPDF">Importar PDF</button>
</div>

</template>

<script setup lang="ts">
import { ref as vueRef } from 'vue';
const pdfInput = vueRef<HTMLInputElement | null>(null);

function abrirImportarPDF() {
    pdfInput.value?.click();
}
import { ref, watch, onMounted } from 'vue';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmModal from './components/ConfirmModal.vue';
import DateField from './components/DateField.vue';
import MoneyField from './components/MoneyField.vue';
import TableExpenses from './components/TableExpenses.vue';
import InputField from './components/InputField.vue';
import { DataFrame } from './types';
import { useTableColors } from './composables/useTableColors';
import { exportToPDF } from './utils/pdfExport';
import { importDataFrameFromPDF } from './utils/pdfImport';
async function onPDFImport(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const dfState = await importDataFrameFromPDF(file);
    if (dfState) {
        dataFrame.restoreState(dfState);
        syncFieldsFromDF();
        if (dfState.dataInicio && dfState.dataTermino) {
            const months = generateMonthsArray(dfState.dataInicio, dfState.dataTermino);
            dataFrame.setMonths(months);
        }
        setDataFrame(dataFrame);
    } else {
        alert('Não foi possível importar os dados do PDF.');
    }
    input.value = '';
}

const STORAGE_KEY = 'afericao-dataframe';
const showModalLimpar = ref(false);
const showModal = ref(false);
const dataFrame = new DataFrame();
const { setDataFrame } = useTableColors();

const dataInicio = ref<string>('');
const dataTermino = ref<string>('');
const valorInicial = ref<number>(0);
const rendimentos = ref<number>(0);
const nomeOSC = ref<string>('');
const nomeProjeto = ref<string>('');
const termoProjeto = ref<string>('');

function abrirModalLimpar() {
    showModalLimpar.value = true;
}
function cancelarLimpar() {
    showModalLimpar.value = false;
}
function confirmarLimpar() {
    localStorage.removeItem(STORAGE_KEY);
    dataFrame.clearAll();
    dataInicio.value = '';
    dataTermino.value = '';
    valorInicial.value = 0;
    rendimentos.value = 0;
    nomeOSC.value = '';
    nomeProjeto.value = '';
    termoProjeto.value = '';
    dataFrame.setMonths([]);
    showModalLimpar.value = false;
}

function abrirModalCopia() {
    showModal.value = true;
}
function cancelarCopia() {
    showModal.value = false;
}
function confirmarCopia() {
    copiarPrevistosParaExecutados();
    showModal.value = false;
}

function copiarPrevistosParaExecutados() {
    const expenses = dataFrame.getExpenseNames();
    const months = dataFrame.getMonthNames();
    for (const expense of expenses) {
        for (const month of months) {
            const predicted = dataFrame.getPredicted(expense, month);
            if (typeof predicted === 'number') {
                dataFrame.setExecuted(expense, month, predicted);
            }
        }
    }
}

function salvarDataFrame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataFrame.getAllState()));
}

function carregarDataFrame() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            dataFrame.restoreState(state);
        } catch (e) {}
    }
    syncFieldsFromDF();
}

function syncFieldsFromDF() {
    dataInicio.value = dataFrame.getDataInicio();
    dataTermino.value = dataFrame.getDataTermino();
    valorInicial.value = dataFrame.getValorInicial();
    rendimentos.value = dataFrame.getRendimentos();
    nomeOSC.value = dataFrame.getNomeOSC();
    nomeProjeto.value = dataFrame.getNomeProjeto();
    termoProjeto.value = dataFrame.getTermoProjeto();
}

function syncFieldsToDF() {
    dataFrame.setDataInicio(dataInicio.value);
    dataFrame.setDataTermino(dataTermino.value);
    dataFrame.setValorInicial(valorInicial.value);
    dataFrame.setRendimentos(rendimentos.value);
    dataFrame.setNomeOSC(nomeOSC.value);
    dataFrame.setNomeProjeto(nomeProjeto.value);
    dataFrame.setTermoProjeto(termoProjeto.value);
}

const generateMonthsArray = (startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate) return [];
    const parseYearMonth = (dateStr: string) => {
        const [year, month] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
    };
    const start = parseYearMonth(startDate);
    const end = parseYearMonth(endDate);
    const months: string[] = [];
    const current = new Date(start);
    while (current <= end) {
        const monthStr = format(current, 'MMM yy', { locale: ptBR });
        months.push(monthStr.charAt(0).toUpperCase() + monthStr.slice(1));
        current.setMonth(current.getMonth() + 1);
    }
    return months;
};

onMounted(() => {
    carregarDataFrame();
    setDataFrame(dataFrame);
});

watch([dataInicio, dataTermino, valorInicial, rendimentos], () => {
    syncFieldsToDF();
    if (dataInicio.value && dataTermino.value) {
        const months = generateMonthsArray(dataInicio.value, dataTermino.value);
        dataFrame.setMonths(months);
    } else {
        dataFrame.setMonths([]);
    }
}, { immediate: true });

watch([nomeOSC, nomeProjeto, termoProjeto], () => {
    syncFieldsToDF();
}, { immediate: true });

watch(
    () => dataFrame.getAllState(),
    () => {
        salvarDataFrame();
    },
    { deep: true }
);

function exportarPDF() {
    exportToPDF(dataFrame);
}

</script>

<style scoped>

.info-fields { 
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-top: 12px;
}

.input-fields {
    display: flex;
    width: 100%;
    justify-content: space-between;
}


.date-fields {
    display: flex;
    gap: 12px;
}

.money-fields {
    display: flex;
    gap: 12px;
}

.action-buttons-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
    border-top: 1px solid lightgray;
    margin: 0 auto;
    width: 95vw;
    padding: 0.5vw
}
.action-btn {
    width: 250px;
    max-width: 250px;
    min-width: 250px;
    padding: 12px 0;
    font-size: 1.1rem;
    border: 1px solid #999;
    background: #f5f5f5;
    cursor: pointer;
    transition: background 0.2s;
}
.action-btn:hover {
    background: #e0e0e0;
}
</style>
