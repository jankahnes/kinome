<template>
  <div
    class="main-card main-card-padding flex flex-col gap-2 items-start"
    ref="root"
  >
    <FormsRatingField
      class="text-primary"
      v-model="userRating"
      @update:model-value="updateRating"
      :select="true"
      :star-width="26"
      :star-height="26"
      :spacing="-2"
      :uniqueId="'950' + id"
    ></FormsRatingField>
    <PagesRecipeNewComment @submit="submitComment" />
    <div class="flex flex-col w-full gap-4 mt-6">
      <PagesRecipeComment
        v-for="(comment, index) in mockComments"
        :comment="comment"
        :id="id"
        :key="index + id"
        :isReply="false"
      ></PagesRecipeComment>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number;
}>();

const root = ref<HTMLElement | null>(null);

const auth = useAuthStore();
const editingComment = ref(false);
const newComment = ref('');
const supabase = useSupabaseClient();

const recipe = useRecipeStore();

const userRating = ref(0);

const mockComments = [
  {
    user: {
      id: '1',
      username: 'John Doe',
      picture: 'https://smovbezqgvxljtvdzvhp.supabase.co/storage/v1/object/public/profile//4771c2f9-d8e8-44e7-967b-74d1f4468e23.jpg',
    },
    content: 'Wonderful recipe!',
    created_at: new Date().toISOString(),
    recipe_id: 1,
    replying_to: null,
    user_id: '1',
  },
  {
    user: {
      id: '2',
      username: 'Jane Doe',
      picture: 'https://smovbezqgvxljtvdzvhp.supabase.co/storage/v1/object/public/profile//4771c2f9-d8e8-44e7-967b-74d1f4468e23.jpg',
    },
    content: 'I love this recipe!',
    rating: 5,
    created_at: new Date().toISOString(),
    recipe_id: 1,
    replying_to: null,
    user_id: '2',
  },
  {
    user: {
      id: '3',
      username: 'Jim Doe',
      picture: 'https://smovbezqgvxljtvdzvhp.supabase.co/storage/v1/object/public/profile//4771c2f9-d8e8-44e7-967b-74d1f4468e23.jpg',
    },
    content: 'I hate this recipe!',
    rating: 1,
    created_at: new Date().toISOString(),
    recipe_id: 1,
    replying_to: null,
    user_id: '3',
  },
];

async function fetchRating() {
  const user = auth.user as any;
  if (user?.id && recipe.recipe?.id) {
    const rating = expectSingleOrNull(
      await getRatings(supabase, {
        eq: {
          user_id: user.id,
          recipe_id: recipe.recipe.id,
        },
      })
    );
    userRating.value = rating?.rating ?? 0;
  }
}

fetchRating();

const hasComment = computed(() => {
  return recipe.recipe?.comments?.some(
    (comment) => !comment.replying_to && comment.user.id === auth.user?.id
  );
});

function updateRating(rating: number) {
  if (!auth.user) {
    navigateTo('/login');
  } else if (recipe.recipe?.id) {
    upsertRating(supabase, rating, auth.user.id, recipe.recipe.id);
    recipe.updateRating(rating, auth.user.id);
  }
}

function submitComment() {
  const user = auth.user as any;
  if (user && recipe.recipe?.id) {
    recipe.addNewComment({
      user: user,
      user_id: user.id,
      content: newComment.value,
      recipe_id: recipe.recipe.id,
      replying_to: null,
      rating: userRating.value,
    });
    newComment.value = '';
    editingComment.value = false;
  }
}
</script>

<style scoped></style>
