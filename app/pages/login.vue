<template>
  <div class="h-200 flex items-center justify-center p-4 pb-8">
    <div class="w-full max-w-md">
      <!-- Card Container -->
      <div
        class="bg-main rounded-xl p-8 space-y-6"
      >
        <!-- Header Section -->
        <div class="text-center space-y-2">
          <div
            class="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4"
          >
            <IconUser class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Login</h1>
          <p class="text-sm text-gray-600">Login to your account</p>
        </div>

        <!-- Main Content Slot -->
        <div class="space-y-4">
          <div class="space-y-2">
            <label
              for="username"
              class="block text-sm font-medium text-gray-700"
              >Username</label
            >
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <IconUser class="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="username"
                v-model="username"
                type="text"
                class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
              >Password</label
            >
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <IconLock class="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            @click="signIn"
            :disabled="!username || !password"
            class="w-full button py-3 px-4 !bg-primary hover:!bg-primary/90 !text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Sign In
          </button>
        </div>

        <!-- Divider -->
        <div class="relative" v-if="$slots['google-auth']">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-main px-2 text-gray-500">OR</span>
          </div>
        </div>

        <!-- Google Sign In -->
        <button
          class="w-full button flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <img :src="'/google.webp'" class="w-5 h-5" alt="Google" />
          <span class="font-medium">Sign in with Google</span>
        </button>

        <!-- Footer Section -->
        <div class="text-center pt-4">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <NuxtLink
              to="/onboarding"
              class="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Create an account here
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const username = ref('');
const password = ref('');
const auth = useAuthStore();

function signIn() {
  if (!username.value || !password.value) return;

  auth.signIn(username.value, password.value);
  navigateTo('/');
}

function handleGoogleAuth() {
  console.log('Google authentication clicked');
}
</script>

<style scoped></style>
