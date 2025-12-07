<template>
  <div>
    <div
      v-for="request in requests"
      :key="request.id"
      class="grid grid-cols-4 gap-4 ml-20 mr-10 my-10"
      v-if="auth.isAdmin()"
    >
      <span class="text-sm text-gray-500">{{ request.ts }}</span>
      <span class="text-sm text-gray-500">{{ request.country }}</span>
      <span class="flex items-center gap-2">
        {{ request.from_url }}
        <IconArrowRight class="w-4 h-4" />
        <span class="text-lg">{{ request.to_url }}</span>
      </span>
      <div>{{ request.user_agent }}</div>
    </div>
  </div>
  <div class="w-0 h-0 bg-fiber bg-salt bg-saturated-fat bg-sugar"></div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();

const { data: requests, error } = await supabase
  .from('request_log')
  .select('*')
  .eq('method', 'NAVIGATION')
  .eq('host', 'www.kinome.app')
  .neq('ip', '89.246.96.135')
  .not('user_agent', 'ilike', '%bot%')
  .order('ts', { ascending: false })
  .limit(100);
</script>

<style scoped></style>
