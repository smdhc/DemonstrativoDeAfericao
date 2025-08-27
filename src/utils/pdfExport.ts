import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataFrame } from '../types';

export function exportToPDF(dataFrame: DataFrame) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const dfState = JSON.stringify(dataFrame.getAllState());
    doc.setProperties({
        title: 'Demonstrativo de Aferição',
        subject: 'Exportação de dados do Demonstrativo de Aferição',
        keywords: `DFDATA:${btoa(unescape(encodeURIComponent(dfState)))}`
    });

    doc.setFontSize(24);
    doc.text('Demonstrativo de Aferição', 148, 40, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Informações', 20, 60);
    doc.setFontSize(12);
    doc.text(`Nome da OSC: ${dataFrame.getNomeOSC() || '-'}`, 20, 70);
    doc.text(`Nome do Projeto: ${dataFrame.getNomeProjeto() || '-'}`, 20, 78);
    doc.text(`Termo do Projeto: ${dataFrame.getTermoProjeto() || '-'}`, 20, 86);
    doc.text(`Data de Início: ${dataFrame.getDataInicio() || '-'}`, 20, 94);
    doc.text(`Data de Término: ${dataFrame.getDataTermino() || '-'}`, 20, 102);
    doc.text(`Valor Inicial: R$ ${dataFrame.getValorInicial().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 110);
    doc.text(`Rendimentos: R$ ${dataFrame.getRendimentos().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 118);

    const tables = [
        {
            title: 'Gastos Previstos',
            type: 'expected',
            getRows: () => buildTableRows(dataFrame, 'predicted')
        },
        {
            title: 'Gastos Executados',
            type: 'executed',
            getRows: () => buildTableRows(dataFrame, 'executed')
        },
        {
            title: 'Remanejamento Percentual',
            type: 'rearranged',
            getRows: () => buildTableRows(dataFrame, 'rearranged')
        }
    ];

    tables.forEach(table => {
        const { head, body } = table.getRows();
        const maxCols = 15;
        const maxRows = 27;

        let colChunks = [];
        if (head.length > maxCols) {
            for (let i = 0; i < head.length - 3; i += (maxCols - 3)) { // -3 para Rubrica, Despesa, Total
                const chunkHead = [head[0], head[1], ...head.slice(i + 2, i + maxCols - 1), 'Total'];
                colChunks.push(chunkHead);
            }
        } else {
            const chunkHead = [head[0], head[1], ...head.slice(2, maxCols - 1), 'Total'];
            colChunks = [chunkHead];
        }

        let rowChunks = [];
        if (body.length + 2 > maxRows) { 
            for (let i = 0; i < body.length; i += (maxRows - 2)) {
                rowChunks.push(body.slice(i, i + (maxRows - 2)));
            }
        } else {
            rowChunks = [body];
        }

        const geralTotalRow = buildGeralTotalRow(head, body);
        const rowTotals = buildRowTotals(body);
        colChunks.forEach((chunkHead, chunkIdx) => {
            if (!chunkHead.includes('Total')) {
                chunkHead.push('Total');
            }
            rowChunks.forEach(chunkBody => {
                const bodyWithTotals = chunkBody.map((row, i) => {
                    const total = rowTotals[i];
                    return [...row.slice(0, chunkHead.length - 1), total];
                });
                let totalRow = geralTotalRow.slice(0, chunkHead.length - 1);
                totalRow.push(geralTotalRow[geralTotalRow.length - 1]);
                doc.addPage('a4', 'landscape');
                doc.setFontSize(18);
                doc.text(table.title, 20, 20);
                autoTable(doc, {
                    head: [chunkHead],
                    body: [...bodyWithTotals, totalRow],
                    startY: 30,
                    theme: 'grid',
                    styles: {
                        fontSize: 5,
                        minCellWidth: 17,
                        overflow: 'visible',
                    },
                    columnStyles: {
                        0: { minCellWidth: 31 },
                        1: { minCellWidth: 31 },
                    },
                    headStyles: {
                        fillColor: [211, 211, 211],
                        textColor: 20,
                    },
                    margin: { left: 2, right: 4 },
                });
            });
        });
    });

    doc.save('demonstrativo_afericao.pdf');
}

function buildTableRows(dataFrame: DataFrame, type: 'predicted' | 'executed' | 'rearranged') {
    const expenses = dataFrame.getExpenseNames();
    const months = dataFrame.getMonthNames();
    const head = ['Rubrica', 'Despesa', ...months, 'Total'];
    const body = expenses.map(expenseKey => {
        const expenseData = dataFrame.getExpenseData(expenseKey);
        const row = [
            expenseData?.rubrica || '-',
            expenseData?.despesa || '-'
        ];
        for (const month of months) {
            let value = '-';
            if (type === 'predicted') value = dataFrame.getPredicted(expenseKey, month) !== undefined ? 'R$ ' + dataFrame.getPredicted(expenseKey, month)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-';
            if (type === 'executed') value = dataFrame.getExecuted(expenseKey, month) !== undefined ? 'R$ ' + dataFrame.getExecuted(expenseKey, month)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-';
            if (type === 'rearranged') value = dataFrame.getRearranged(expenseKey, month) !== undefined ? dataFrame.getRearranged(expenseKey, month)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' %' : '-';
            row.push(value);
        }
        let totalValue = '-';
        if (type === 'predicted') {
            const total = months.reduce((acc, month) => acc + (dataFrame.getPredicted(expenseKey, month) || 0), 0);
            totalValue = 'R$ ' + (total ? total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-');
        } else if (type === 'executed') {
            const total = months.reduce((acc, month) => acc + (dataFrame.getExecuted(expenseKey, month) || 0), 0);
            totalValue = 'R$ ' + (total ? total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-');
        } else if (type === 'rearranged') {
            const total = months.reduce((acc, month) => acc + (dataFrame.getRearranged(expenseKey, month) || 0), 0);
            totalValue = (total ? total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-') + ' %';
        }
        row.push(totalValue);
        return row;
    });
    return { head, body };
}

function buildRowTotals(body: any[]): string[] {
    return body.map(row => {
        let sum = 0;
        for (let col = 2; col < row.length - 1; col++) {
            const val = parseFloat((row[col] || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
            if (!isNaN(val)) sum += val;
        }
        if (row[row.length - 1].includes('R$')) {
            return 'R$ ' + (sum ? sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-');
        } else if (row[row.length - 1].includes('%')) {
            return (sum ? sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-') + ' %';
        }
        return sum ? sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-';
    });
}

function buildGeralTotalRow(head: string[], body: any[]): any[] {
    const totalRow = ['Total', ''];
    for (let col = 2; col < head.length; col++) {
        let sum = 0;
        for (const row of body) {
            const val = parseFloat((row[col] || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
            if (!isNaN(val)) sum += val;
        }
        if (body[0] && body[0][col] && body[0][col].includes('R$')) {
            totalRow.push('R$ ' + (sum ? sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'));
        } else if (body[0] && body[0][col] && body[0][col].includes('%')) {
            totalRow.push((sum ? sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-') + ' %');
        } else {
            totalRow.push(sum ? sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-');
        }
    }
    if (totalRow.length < head.length) {
        totalRow[head.length - 1] = totalRow[totalRow.length - 1];
    }
    return totalRow;
}
