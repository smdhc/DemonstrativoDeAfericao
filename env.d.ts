/// <reference types="vite/client" />

// Permite importar arquivos .vue em TypeScript
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
