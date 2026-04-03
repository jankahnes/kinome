<template>
    <div>

    </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
auth.signOut();
navigateTo('/');
</script>

<style scoped></style>