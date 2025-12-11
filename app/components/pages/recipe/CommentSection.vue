<template>
  <div class="main-card main-card-padding flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <div class="flex gap-4 justify-between">
        <h3 class="text-2xl font-bold">Leave a comment</h3>
      </div>
      <div class="flex gap-2 w-full">
        <Avatar :user="auth.user" class="w-12 h-12" />
        <div class="flex-1 flex flex-col gap-2 items-end">
          <div class="flex gap-4 p-2 rounded-xl border border-slate-200 w-full flex-wrap">
            <textarea
              v-model="newComment"
              v-auto-resize
              placeholder="Add a comment"
              class="flex-1 focus:outline-none resize-none scrollbar-hide overflow-hidden break-words min-h-28 shrink-0 min-w-40"
              rows="5"
            ></textarea>
            <div class="flex flex-col-reverse new-comment-wrap:flex-col items-start new-comment-wrap:items-end">
              <FormsRatingField
                class="text-primary"
                v-model="userRating"
                @update:model-value="updateRating"
                :select="true"
                :star-width="28"
                :star-height="28"
                :spacing="-2"
                :uniqueId="'950' + id"
              ></FormsRatingField>
              <span class="text-xs text-gray-500 mr-1">Click to rate</span>
            </div>
          </div>
          <button
            class="animated-button bg-[#DCCAB2] px-4 py-0.5 text-lg"
            @click="submitComment"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
    <div class="flex flex-col" v-if="recipeStore.recipe?.comments?.length">
      <h3 class="text-2xl font-bold mb-4">Comments</h3>
      <div v-for="(comment, index) in recipeStore.recipe.comments">
        <PagesRecipeComment
          :comment="comment"
          :id="index + id"
          :key="index + id"
          :isReply="false"
        ></PagesRecipeComment>
        <div
          class="h-px bg-slate-200 my-4"
          v-if="index !== recipeStore.recipe.comments.length - 1"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number;
}>();

const auth = useAuthStore();
const newComment = ref('');
const supabase = useSupabaseClient();

const recipeStore = useRecipeStore();

const userRating = ref(0);

async function fetchRating() {
  const user = auth.user as any;
  if (user?.id && recipeStore.recipe?.id) {
    const rating = expectSingleOrNull(
      await getRatings(supabase, {
        eq: {
          user_id: user.id,
          recipe_id: recipeStore.recipe.id,
        },
      })
    );
    userRating.value = rating?.rating ?? 0;
  }
}

watchEffect(() => {
  void fetchRating();
});

function updateRating(rating: number) {
  if (!auth.user) {
    navigateTo('/login');
  } else if (recipeStore.recipe?.id) {
    upsertRating(supabase, rating, auth.user.id, recipeStore.recipe.id);
    recipeStore.updateRating(rating, auth.user.id);
  }
}

function submitComment() {
  const user = auth.user as any;
  if (!user) {
    navigateTo('/login');
    return;
  }
  if (!recipeStore.recipe?.id) return;
  if (!newComment.value.trim()) return;

  recipeStore.addNewComment({
    user: user,
    user_id: user.id,
    content: newComment.value.trim(),
    recipe_id: recipeStore.recipe.id,
    replying_to: null,
    rating: userRating.value,
  });
  newComment.value = '';
}
</script>

<style scoped></style>
