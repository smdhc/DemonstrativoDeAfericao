export interface MoneyInputState {
  centavos: number;
  focused: boolean;
}

export class MoneyInputManager {
  private state: MoneyInputState;
  private prefix: string;
  private max: number;
  private min: number;

  constructor(
    initialValue: number | string = 0,
    prefix: string = 'R$ ',
    max: number = 99999999.99,
    min: number = 0
  ) {
    this.prefix = prefix;
    this.max = max;
    this.min = min;
    this.state = {
      centavos: Math.round(this.parseNumericValue(initialValue) * 100),
      focused: false
    };
  }


  formatCurrency(centavos: number): string {
    const value = centavos / 100;
    
    if (value === null || value === undefined || isNaN(value)) {
      return this.prefix + '0,00';
    }
    
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(value));
    
    const sign = value < 0 ? '-' : '';
    return sign + this.prefix + formatted;
  }

  parseNumericValue(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    const cleanValue = String(value)
      .replace(/[^\d,-]/g, '')
      .replace(',', '.');
    
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : numericValue;
  }
 
  getDisplayValue(): string {
    if (this.state.centavos === 0 && !this.state.focused) {
      return '';
    }
    return this.formatCurrency(this.state.centavos);
  }

  getValue(): number {
    return this.state.centavos / 100;
  }

  setValue(value: number | string): void {
    if (this.state.focused) return;
    
    const numericValue = this.parseNumericValue(value);
    this.state.centavos = Math.round(numericValue * 100);
  }

  addDigit(digit: number): boolean {
    if (digit < 0 || digit > 9) return false;
    
    const newCentavos = (this.state.centavos * 10) + digit;
    const newValue = newCentavos / 100;
    
    if (newValue > this.max) {
      return false;
    }
    
    this.state.centavos = newCentavos;
    return true;
  }

  removeLastDigit(): void {
    this.state.centavos = Math.floor(this.state.centavos / 10);
  }

  setFocused(focused: boolean): void {
    this.state.focused = focused;
  }

  isFocused(): boolean {
    return this.state.focused;
  }

  handleKeydown(event: KeyboardEvent): { handled: boolean; shouldEmit: boolean } {
    const allowedKeys = [
      'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 
      'Delete', 'Backspace', 'F5'
    ];
    
    if (allowedKeys.includes(event.key)) {
      if (event.key === 'Backspace') {
        event.preventDefault();
        this.removeLastDigit();
        return { handled: true, shouldEmit: true };
      }
      return { handled: false, shouldEmit: false };
    }

    if (event.ctrlKey || event.metaKey) {
      return { handled: false, shouldEmit: false };
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return { handled: true, shouldEmit: false };
    }

    event.preventDefault();
    const success = this.addDigit(parseInt(event.key));
    return { handled: true, shouldEmit: success };
  }

  getState(): MoneyInputState {
    return { ...this.state };
  }
}

export function useMoneyInput(
  initialValue: number | string = 0,
  prefix: string = 'R$ ',
  max: number = 99999999.99,
  min: number = 0
) {
  const manager = new MoneyInputManager(initialValue, prefix, max, min);

  return {
    manager,
    formatCurrency: (centavos: number) => manager.formatCurrency(centavos),
    parseNumericValue: (value: any) => manager.parseNumericValue(value),
    getDisplayValue: () => manager.getDisplayValue(),
    getValue: () => manager.getValue(),
    setValue: (value: number | string) => manager.setValue(value),
    addDigit: (digit: number) => manager.addDigit(digit),
    removeLastDigit: () => manager.removeLastDigit(),
    setFocused: (focused: boolean) => manager.setFocused(focused),
    isFocused: () => manager.isFocused(),
    handleKeydown: (event: KeyboardEvent) => manager.handleKeydown(event),
    getState: () => manager.getState()
  };
}

export function formatMoney(centavos: number, prefix: string = 'R$ '): string {
  const value = centavos / 100;
  
  if (value === null || value === undefined || isNaN(value)) {
    return prefix + '0,00';
  }
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value));
  
  const sign = value < 0 ? '-' : '';
  return sign + prefix + formatted;
}

export function toCentavos(value: number | string): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  
  const cleanValue = String(value)
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : Math.round(numericValue * 100);
}

export function fromCentavos(centavos: number): number {
  return centavos / 100;
}
