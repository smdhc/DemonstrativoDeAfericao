import { reactive } from 'vue';

export interface CellData {
    predicted: number;
    executed: number;
    rearranged: number;
}

export interface ExpenseTuple {
    rubrica: string;
    despesa: string;
}

export class DataFrame {
    private data: Record<string, Record<string, CellData>> = reactive({});
    private expenses: Record<string, ExpenseTuple> = reactive({});
    private T: number = 1;
    private dataInicio: string = '';
    private dataTermino: string = '';
    private valorInicial: number = 0;
    private rendimentos: number = 0;
    private nomeOSC: string = '';
    private nomeProjeto: string = '';
    private termoProjeto: string = '';

    setNomeOSC(value: string): void {
        this.nomeOSC = value;
    }
    getNomeOSC(): string {
        return this.nomeOSC;
    }

    setNomeProjeto(value: string): void {
        this.nomeProjeto = value;
    }
    getNomeProjeto(): string {
        return this.nomeProjeto;
    }

    setTermoProjeto(value: string): void {
        this.termoProjeto = value;
    }
    getTermoProjeto(): string {
        return this.termoProjeto;
    }

    setT(value: number): void {
        if (value === 0) {
            throw new Error("T cannot be zero to avoid division by zero");
        }
        this.T = value;
        this.recalculateAllRearranged();
    }

    setDataInicio(value: string): void {
        this.dataInicio = value;
    }
    getDataInicio(): string {
        return this.dataInicio;
    }

    setDataTermino(value: string): void {
        this.dataTermino = value;
    }
    getDataTermino(): string {
        return this.dataTermino;
    }

    setValorInicial(value: number): void {
        this.valorInicial = value;
        this.updateT();
    }
    getValorInicial(): number {
        return this.valorInicial;
    }

    setRendimentos(value: number): void {
        this.rendimentos = value;
        this.updateT();
    }
    getRendimentos(): number {
        return this.rendimentos;
    }

    private updateT(): void {
        const total = this.valorInicial + this.rendimentos;
        if (total > 0) {
            this.setT(total);
        } else {
            this.setT(1);
        }
    }

    getT(): number {
        return this.T;
    }

    private calculateRearranged(predicted: number, executed: number): number {
        return executed > predicted ? (executed - predicted) / this.T : 0;
    }

    private recalculateAllRearranged(): void {
        for (const expense in this.data) {
            for (const month in this.data[expense]) {
                const cell = this.data[expense][month];
                cell.rearranged = this.calculateRearranged(cell.predicted, cell.executed);
            }
        }
    }

    setValue(expense: string, month: string, predicted: number, executed: number): void {
        if (!this.data[expense]) {
            this.data[expense] = {};
        }
        
        const rearranged = this.calculateRearranged(predicted, executed);
        
        this.data[expense][month] = {
            predicted,
            executed,
            rearranged
        };
    }

    setExpenseData(expenseKey: string, rubrica: string, despesa: string): void {
        this.expenses[expenseKey] = { rubrica, despesa };
        
        if (!this.data[expenseKey]) {
            this.data[expenseKey] = {};
            const months = this.getMonthNames();
            for (const month of months) {
                this.data[expenseKey][month] = {
                    predicted: 0,
                    executed: 0,
                    rearranged: 0
                };
            }
        }
    }

    setPredicted(expense: string, month: string, predicted: number): void {
        if (!this.data[expense]?.[month]) {
            throw new Error(`Cell [${expense}][${month}] does not exist`);
        }
        
        this.data[expense][month].predicted = predicted;
        this.data[expense][month].rearranged = this.calculateRearranged(
            predicted, 
            this.data[expense][month].executed
        );
    }

    setExecuted(expense: string, month: string, executed: number): void {
        if (!this.data[expense]?.[month]) {
            throw new Error(`Cell [${expense}][${month}] does not exist`);
        }
        
        this.data[expense][month].executed = executed;
        this.data[expense][month].rearranged = this.calculateRearranged(
            this.data[expense][month].predicted, 
            executed
        );
    }

    getValue(expense: string, month: string): CellData | undefined {
        return this.data[expense]?.[month] ? { ...this.data[expense][month] } : undefined;
    }

    getPredicted(expense: string, month: string): number | undefined {
        return this.data[expense]?.[month]?.predicted;
    }

    getExecuted(expense: string, month: string): number | undefined {
        return this.data[expense]?.[month]?.executed;
    }

    getRearranged(expense: string, month: string): number | undefined {
        return this.data[expense]?.[month]?.rearranged;
    }

    getExpenseData(expenseKey: string): ExpenseTuple | undefined {
        return this.expenses[expenseKey] ? { ...this.expenses[expenseKey] } : undefined;
    }

    getExpenseRubrica(expenseKey: string): string {
        return this.expenses[expenseKey]?.rubrica || '';
    }

    getExpenseDespesa(expenseKey: string): string {
        return this.expenses[expenseKey]?.despesa || '';
    }

    getExpense(expense: string): Record<string, CellData> | undefined {
        return this.data[expense] ? JSON.parse(JSON.stringify(this.data[expense])) : undefined;
    }

    getMonth(month: string): Record<string, CellData> {
        const monthData: Record<string, CellData> = {};
        
        for (const expenseName in this.data) {
            if (this.data[expenseName][month] !== undefined) {
                monthData[expenseName] = { ...this.data[expenseName][month] };
            }
        }
        
        return monthData;
    }

    getExpenseNames(): string[] {
        return Object.keys(this.data).filter(key => key !== '_months');
    }

    getMonthNames(): string[] {
        const months = new Set<string>();
        
        for (const expense in this.data) {
            Object.keys(this.data[expense]).forEach(month => months.add(month));
        }
        
        return Array.from(months);
    }

    hasExpense(expense: string): boolean {
        return expense in this.data;
    }

    hasMonth(month: string): boolean {
        return this.getMonthNames().includes(month);
    }

    setMonths(months: string[]): void {
        const currentExpenses = this.getExpenseNames();
        const currentMonths = this.getMonthNames();
        
        const commonMonths = months.filter(month => currentMonths.includes(month));
        
        const savedData: Record<string, Record<string, CellData>> = {};
        for (const expense of currentExpenses) {
            savedData[expense] = {};
            for (const month of commonMonths) {
                if (this.data[expense]?.[month]) {
                    savedData[expense][month] = { ...this.data[expense][month] };
                }
            }
        }
        
        Object.keys(this.data).forEach(key => delete this.data[key]);
        
        if (currentExpenses.length === 0) {
            this.data['_months'] = {};
            for (const month of months) {
                this.data['_months'][month] = {
                    predicted: 0,
                    executed: 0,
                    rearranged: 0
                };
            }
        } else {
            for (const expense of currentExpenses) {
                this.data[expense] = {};
                for (const month of months) {
                    if (savedData[expense]?.[month]) {
                        this.data[expense][month] = savedData[expense][month];
                    } else {
                        this.data[expense][month] = {
                            predicted: 0,
                            executed: 0,
                            rearranged: 0
                        };
                    }
                }
            }
        }
    }

    addExpense(expenseKey: string, rubrica: string = '', despesa: string = ''): boolean {
        if (this.hasExpense(expenseKey)) {
            return false;
        }
        
        this.expenses[expenseKey] = { rubrica, despesa };
        
        if ('_months' in this.data) {
            const months = Object.keys(this.data['_months']);
            delete this.data['_months'];
            
            this.data[expenseKey] = {};
            for (const month of months) {
                this.data[expenseKey][month] = {
                    predicted: 0,
                    executed: 0,
                    rearranged: 0
                };
            }
        } else {
            this.data[expenseKey] = {};
            const months = this.getMonthNames();
            
            for (const month of months) {
                this.data[expenseKey][month] = {
                    predicted: 0,
                    executed: 0,
                    rearranged: 0
                };
            }
        }
        
        return true;
    }

    removeExpense(expenseKey: string): boolean {
        if (this.hasExpense(expenseKey)) {
            delete this.data[expenseKey];
            delete this.expenses[expenseKey];
            return true;
        }
        return false;
    }

    getAllData(): Record<string, Record<string, CellData>> {
        return JSON.parse(JSON.stringify(this.data));
    }

    getAllState(): {
        data: Record<string, Record<string, CellData>>;
        expenses: Record<string, ExpenseTuple>;
        T: number;
        dataInicio: string;
        dataTermino: string;
        valorInicial: number;
        rendimentos: number;
        nomeOSC: string;
        nomeProjeto: string;
        termoProjeto: string;
    } {
        return {
            data: JSON.parse(JSON.stringify(this.data)),
            expenses: JSON.parse(JSON.stringify(this.expenses)),
            T: this.T,
            dataInicio: this.dataInicio,
            dataTermino: this.dataTermino,
            valorInicial: this.valorInicial,
            rendimentos: this.rendimentos,
            nomeOSC: this.nomeOSC,
            nomeProjeto: this.nomeProjeto,
            termoProjeto: this.termoProjeto
        };
    }

    restoreState(state: {
        data: Record<string, Record<string, CellData>>;
        expenses: Record<string, ExpenseTuple>;
        T: number;
        dataInicio: string;
        dataTermino: string;
        valorInicial: number;
        rendimentos: number;
        nomeOSC?: string;
        nomeProjeto?: string;
        termoProjeto?: string;
    }): void {
        Object.keys(this.data).forEach(key => delete this.data[key]);
        Object.keys(this.expenses).forEach(key => delete this.expenses[key]);
        for (const expenseKey in state.expenses) {
            this.expenses[expenseKey] = { ...state.expenses[expenseKey] };
        }
        for (const expense in state.data) {
            this.data[expense] = {};
            for (const month in state.data[expense]) {
                this.data[expense][month] = { ...state.data[expense][month] };
            }
        }
    this.T = state.T ?? 1;
    this.dataInicio = state.dataInicio ?? '';
    this.dataTermino = state.dataTermino ?? '';
    this.valorInicial = state.valorInicial ?? 0;
    this.rendimentos = state.rendimentos ?? 0;
    this.nomeOSC = state.nomeOSC ?? '';
    this.nomeProjeto = state.nomeProjeto ?? '';
    this.termoProjeto = state.termoProjeto ?? '';
    }

    clearAll(): void {
        Object.keys(this.data).forEach(key => delete this.data[key]);
        Object.keys(this.expenses).forEach(key => delete this.expenses[key]);
        this.T = 1;
        this.dataInicio = '';
        this.dataTermino = '';
        this.valorInicial = 0;
        this.rendimentos = 0;
    }

    getAllExpenses(): Record<string, ExpenseTuple> {
        return JSON.parse(JSON.stringify(this.expenses));
    }
}