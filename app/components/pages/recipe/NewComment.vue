<template>
  <div class="flex gap-2 w-full items-center">
    <Avatar :user="auth.user" class="w-10 h-10" />
    <textarea
      v-model="comment"
      v-auto-resize
      placeholder="Add a comment"
      class="flex-1 p-2 rounded-xl bg-slate-50 border border-primary focus:outline-none resize-none scrollbar-hide overflow-hidden break-words min-h-10"
      rows="1"
    ></textarea>
    <button
      class="bg-primary text-white px-4 py-2 rounded-xl"
      @click="emit('submit', comment)"
    >
      Submit
    </button>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

const emit = defineEmits<{
  (e: 'submit', comment: string): void;
}>();

const comment = ref('');
</script>

<style scoped></style>
