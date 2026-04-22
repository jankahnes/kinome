<template>
  <div class="h-svh flex items-center justify-center p-4 pb-14 md:pb-30">
    <div class="w-full max-w-md space-y-6 p-8">
      <!-- Card Container -->
      <!-- Header Section -->
      <div class="text-center space-y-2">
        <div class="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <IconUser class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-headers">Login</h1>
        <p class="text-sm text-gray-600">Sign in to your account</p>
      </div>

      <form class="space-y-4" @submit.prevent="signIn">
        <div class="space-y-4">
          <div class="space-y-1">
          <label for="username" class="block text-sm text-gray-700">Email or username</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconUser class="w-5 h-5 text-gray-400" />
            </div>
            <input id="username" v-model="username" type="text" autocomplete="username"
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Enter your email or username" required />
          </div>
        </div>

          <div class="space-y-1">
          <label for="password" class="block text-sm text-gray-700">Password</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconLock class="w-5 h-5 text-gray-400" />
            </div>
            <input id="password" v-model="password" type="password" autocomplete="current-password"
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Enter your password" required />
            </div>
          </div>
        </div>

        <div class="space-y-2">
        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ error }}
        </p>

        <button type="submit" :disabled="!username || !password || loading"
          class="w-full button py-2 px-4 !bg-primary hover:!bg-primary/90 !text-white font-headers italic! text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-main px-2 text-gray-500">OR</span>
          </div>
        </div>

        <!-- Google Sign In -->
        <button type="button" @click="handleGoogleAuth"
          class="w-full button flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 hover:bg-gray-50 transition-colors">
          <img :src="'/google.webp'" class="w-5 h-5" alt="Google" />
          <span class="font-medium">Sign in with Google</span>
        </button>
        </div>
      </form>

      <!-- Footer Section -->
      <div class="text-center pt-4">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <NuxtLink to="/onboarding" class="font-semibold transition-colors">
            Create an account here
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
});

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const auth = useAuthStore();

async function signIn() {
  if (!username.value || !password.value || loading.value) return;

  error.value = '';
  loading.value = true;

  try {
    const { error: signInError } = await auth.signIn(username.value, password.value);
    if (signInError) {
      error.value = signInError.message;
      return;
    }
    await navigateTo('/');
  } catch (err: any) {
    error.value = err?.message ?? 'Could not sign in';
  } finally {
    loading.value = false;
  }
}

function handleGoogleAuth() {
  auth.signInWithGoogle('/');
}
</script>

<style scoped></style>
