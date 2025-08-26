import { ref, reactive } from 'vue';

interface HoverState {
  rowIndex: number | null;
  cellIndex: number | null;
  tableType: 'expenses' | 'months' | 'total' | null;
}

const hoverState = reactive<HoverState>({
  rowIndex: null,
  cellIndex: null,
  tableType: null
});

export function useHover() {
  const setHover = (rowIndex: number | null, cellIndex: number | null = null, tableType: 'expenses' | 'months' | 'total' | null = null) => {
    hoverState.rowIndex = rowIndex;
    hoverState.cellIndex = cellIndex;
    hoverState.tableType = tableType;
  };

  const clearHover = () => {
    hoverState.rowIndex = null;
    hoverState.cellIndex = null;
    hoverState.tableType = null;
  };

  const isRowHovered = (rowIndex: number): boolean => {
    return hoverState.rowIndex === rowIndex;
  };

  const isCellHovered = (rowIndex: number, cellIndex: number, tableType: 'expenses' | 'months' | 'total'): boolean => {
    return hoverState.rowIndex === rowIndex && 
           hoverState.cellIndex === cellIndex && 
           hoverState.tableType === tableType;
  };

  return {
    hoverState,
    setHover,
    clearHover,
    isRowHovered,
    isCellHovered
  };
}
