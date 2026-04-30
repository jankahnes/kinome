<template>
  <div class="main-card main-card-padding main-card-rounded flex flex-col gap-8">

    <!-- Creator photo (user-created recipes only) -->
    <div v-if="creatorPhoto" class="flex flex-col gap-2">
      <img :src="creatorPhoto" class="w-full rounded-2xl object-cover max-h-72" />
      <div class="flex items-center gap-1.5">
        <span
          class="text-[10px] font-semibold uppercase tracking-wide bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">Creator</span>
        <span class="text-xs text-gray-400">Original dish</span>
      </div>
    </div>

    <!-- Input section -->
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 w-full">
        <Avatar :user="auth.user" class="w-12 h-12" />
        <div class="flex-1 flex flex-col gap-2 items-end">
          <div class="flex gap-4 p-2 rounded-xl border border-slate-200 w-full flex-wrap">
            <textarea v-model="newComment" v-auto-resize placeholder="Add a comment"
              class="flex-1 focus:outline-none resize-none scrollbar-hide overflow-hidden wrap-break-word min-h-28 shrink-0 min-w-40"
              rows="5"></textarea>
            <div class="flex flex-col-reverse new-comment-wrap:flex-col items-start new-comment-wrap:items-end">
              <FormsRatingField class="" v-model="userRating" @update:model-value="updateRating" :select="true"
                :star-width="28" :star-height="28" :spacing="-2" :uniqueId="'950' + id">
              </FormsRatingField>
              <span class="text-xs text-gray-500 mr-1">Click to rate</span>
            </div>
          </div>

          <!-- Pending photo preview -->
          <div v-if="pendingPhotoPreview" class="w-full relative">
            <img :src="pendingPhotoPreview" class="w-full rounded-xl object-cover max-h-44" />
            <button
              class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
              @click="removePendingPhoto">
              <IconX class="w-3 h-3 text-white" />
            </button>
          </div>

          <!-- Bottom row: photo button + submit -->
          <div class="flex gap-2 w-full items-center justify-between">
            <button class="main-button animated-button bg-gray-100/70! px-2 py-1 flex gap-1.5 items-center text-gray-600 outline-1 outline-gray-200 text-xs rounded-xl!"
              @click="triggerPhotoInput" :disabled="photoUploading">
              <IconLoader class="w-3 animate-spin" v-if="photoUploading" />
              <IconCamera class="w-3" v-else />
              <span>{{ photoUploading ? 'Uploading…' : 'Photo' }}</span>
            </button>
            <button class="animated-button bg-primary text-white font-headers italic px-3 py-1 rounded-xl! font-medium" @click="submitComment"
              :disabled="photoUploading">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comment list -->
    <div class="flex flex-col gap-8" v-if="recipeStore.recipe?.comments?.length">
      <div v-for="(comment, index) in recipeStore.recipe.comments">
        <PagesRecipeComment :comment="comment" :id="index + id" :key="index + id" :isReply="false" />
      </div>
    </div>
  </div>

  <input ref="photoInput" type="file" accept="image/*" class="hidden" @change="handlePhotoSelected" />
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number;
}>();

const USER_CREATED_SOURCE_TYPES = ['PREPARSED', 'TEXT', 'PICTURE', 'TITLE'];

const auth = useAuthStore();
const newComment = ref('');
const supabase = useSupabaseClient();
const recipeStore = useRecipeStore();
const userRating = ref(0);

const photoInput = ref<HTMLInputElement | null>(null);
const photoUploading = ref(false);
const pendingPhotoUrl = ref<string | null>(null);
const pendingPhotoPreview = ref<string | null>(null);

const creatorPhoto = computed(() => {
  const recipe = recipeStore.recipe as any;
  if (!recipe?.picture || recipe.picture.includes('/public/recipe/')) return null;
  if (!USER_CREATED_SOURCE_TYPES.includes(recipe.source_type ?? '')) return null;
  return recipe.picture;
});

async function fetchRating() {
  const user = auth.user as any;
  if (user?.id && recipeStore.recipe?.id) {
    const rating = expectSingleOrNull(
      await getRatings(supabase, {
        eq: { user_id: user.id, recipe_id: recipeStore.recipe.id },
      })
    );
    userRating.value = rating?.rating ?? 0;
  }
}

watchEffect(() => { void fetchRating(); });

function updateRating(rating: number) {
  if (!auth.user) {
    navigateTo('/login');
  } else if (recipeStore.recipe?.id) {
    upsertRating(supabase, rating, auth.user.id, recipeStore.recipe.id);
    recipeStore.updateRating(rating, auth.user.id);
  }
}

const triggerPhotoInput = () => photoInput.value?.click();

function removePendingPhoto() {
  pendingPhotoUrl.value = null;
  pendingPhotoPreview.value = null;
  if (photoInput.value) photoInput.value.value = '';
}

async function handlePhotoSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  pendingPhotoPreview.value = URL.createObjectURL(file);
  photoUploading.value = true;

  try {
    const user = auth.user as any;
    if (!user?.id) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('bucket', 'recipe_user_pictures');
    formData.append('id', `${user.id}-${Date.now()}`);
    const result = await $fetch('/api/db/upload-image', { method: 'POST', body: formData });
    pendingPhotoUrl.value = (result as any).publicUrl;
  } catch (e) {
    console.error('Photo upload failed:', e);
    removePendingPhoto();
  } finally {
    photoUploading.value = false;
  }
}

async function submitComment() {
  const user = auth.user as any;
  if (!user) { navigateTo('/login'); return; }
  if (!recipeStore.recipe?.id) return;
  if (!newComment.value.trim() && !pendingPhotoUrl.value) return;

  await recipeStore.addNewComment({
    user,
    user_id: user.id,
    content: newComment.value.trim(),
    recipe_id: recipeStore.recipe.id,
    replying_to: null,
    rating: userRating.value,
    picture: pendingPhotoUrl.value,
  } as any);

  newComment.value = '';
  removePendingPhoto();
}
</script>

<style scoped></style>
