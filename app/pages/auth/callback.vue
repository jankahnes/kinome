<template>
  <div class="h-svh flex items-center justify-center p-6 text-center">
    <div class="space-y-2">
      <IconLoaderCircle class="mx-auto h-7 w-7 animate-spin text-primary" />
      <p class="text-sm text-gray-500">Signing you in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const route = useRoute();
const supabase = useSupabaseClient();
const auth = useAuthStore();

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('OAuth callback timed out')), ms);
    }),
  ]);
}

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : '';
  const next = typeof route.query.next === 'string' ? route.query.next : '/';

  if (!code) {
    await navigateTo(next, { replace: true });
    return;
  }

  const exchangeResult = await withTimeout(
    supabase.auth.exchangeCodeForSession(code),
    5000,
  ).catch((error) => ({ data: null, error }));
  const { error } = exchangeResult;

  if (error) {
    const { data } = await withTimeout(supabase.auth.getSession(), 5000).catch(
      () => ({ data: { session: null } }),
    );

    if (!data.session) {
      console.error('Failed to complete OAuth sign-in:', error);
      await navigateTo('/login', { replace: true });
      return;
    }
  }

  const sessionResult = await withTimeout(supabase.auth.getSession(), 5000).catch(
    (sessionError) => ({ data: { session: null }, error: sessionError }),
  );
  const session = sessionResult.data?.session ?? null;

  if (!session?.user) {
    console.error(
      'OAuth callback finished without an authenticated session:',
      sessionResult.error ?? error,
    );
    await navigateTo('/login', { replace: true });
    return;
  }

  if (auth.user?.id === session.user.id && auth.user) {
    Object.assign(auth.user, session.user as any);
  } else {
    auth.user = session.user as any;
  }
  auth.userFetched = false;
  auth.profileFetched = false;

  await navigateTo(next, { replace: true });
});
</script>
