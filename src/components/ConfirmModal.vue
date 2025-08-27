<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button @click="$emit('confirm')">{{ confirmText }}</button>
        <button @click="$emit('cancel')">{{ cancelText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps({
  show: Boolean,
  title: { type: String, default: 'Confirmar ação' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Continuar' },
  cancelText: { type: String, default: 'Cancelar' }
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 32px 24px;
  border-radius: 0px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  max-width: 400px;
  text-align: center;
}
.modal-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

button {
    width: 100px;
}

</style>
