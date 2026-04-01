<template>
    <div></div>
</template>

<script setup lang="ts">
const route = useRoute();
const id = route.params.id as string;

navigateTo(`/profile/${id}/recipes`, { replace: true });
</script>
