import { ref, computed } from 'vue';
import type { DataFrame } from '../types';

const globalDataFrame = ref<DataFrame | null>(null);

export function useTableColors() {
    const setDataFrame = (df: DataFrame) => {
        globalDataFrame.value = df;
    };

    const getCellColorClass = (expenseKey: string | undefined, mes: string, isTotal: boolean = false): string => {
        if (!globalDataFrame.value || !expenseKey) return '';
        
        const predicted = globalDataFrame.value.getPredicted(expenseKey, mes);
        const executed = globalDataFrame.value.getExecuted(expenseKey, mes);
        
        if (!predicted && !executed) return '';
        
        const predictedValue = predicted || 0;
        const executedValue = executed || 0;
        
        if (executedValue > predictedValue) {
            return isTotal ? 'cell-red-total' : 'cell-red';
        } else if (predictedValue > executedValue) {
            return isTotal ? 'cell-blue-total' : 'cell-blue';
        }
        
        return '';
    };

    const getMonthTotalColorClass = (mes: string, expenses: Array<{ expenseKey?: string }>, isTotal: boolean = false): string => {
        if (!globalDataFrame.value) return '';
        
        let totalPredicted = 0;
        let totalExecuted = 0;
        
        expenses.forEach(expense => {
            if (expense.expenseKey) {
                const predicted = globalDataFrame.value!.getPredicted(expense.expenseKey, mes) || 0;
                const executed = globalDataFrame.value!.getExecuted(expense.expenseKey, mes) || 0;
                totalPredicted += predicted;
                totalExecuted += executed;
            }
        });
        
        if (totalExecuted > totalPredicted) {
            return isTotal ? 'cell-red-total' : 'cell-red';
        } else if (totalPredicted > totalExecuted) {
            return isTotal ? 'cell-blue-total' : 'cell-blue';
        }
        
        return '';
    };

    const getRowTotalColorClass = (expenseKey: string | undefined, meses: string[], isTotal: boolean = false): string => {
        if (!globalDataFrame.value || !expenseKey) return '';
        
        let totalPredicted = 0;
        let totalExecuted = 0;
        
        meses.forEach(mes => {
            const predicted = globalDataFrame.value!.getPredicted(expenseKey, mes) || 0;
            const executed = globalDataFrame.value!.getExecuted(expenseKey, mes) || 0;
            totalPredicted += predicted;
            totalExecuted += executed;
        });
        
        if (totalExecuted > totalPredicted) {
            return isTotal ? 'cell-red-total' : 'cell-red';
        } else if (totalPredicted > totalExecuted) {
            return isTotal ? 'cell-blue-total' : 'cell-blue';
        }
        
        return '';
    };

    const getGeneralTotalColorClass = (meses: string[], expenses: Array<{ expenseKey?: string }>): string => {
        if (!globalDataFrame.value) return '';
        
        let totalPredicted = 0;
        let totalExecuted = 0;
        
        expenses.forEach(expense => {
            if (expense.expenseKey) {
                meses.forEach(mes => {
                    const predicted = globalDataFrame.value!.getPredicted(expense.expenseKey!, mes) || 0;
                    const executed = globalDataFrame.value!.getExecuted(expense.expenseKey!, mes) || 0;
                    totalPredicted += predicted;
                    totalExecuted += executed;
                });
            }
        });
        
        if (totalExecuted > totalPredicted) {
            return 'cell-red-total';
        } else if (totalPredicted > totalExecuted) {
            return 'cell-blue-total';
        }
        
        return '';
    };

    return {
        setDataFrame,
        getCellColorClass,
        getMonthTotalColorClass,
        getRowTotalColorClass,
        getGeneralTotalColorClass
    };
}
