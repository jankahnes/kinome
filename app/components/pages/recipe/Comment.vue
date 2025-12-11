<template>
  <div class="flex gap-4">
    <div class="flex flex-col items-center gap-2">
      <Avatar
        :user="comment.user"
        class="w-12 h-12"
        :class="isReply ? 'w-10! h-10!' : ''"
      />
      <div
        class="w-px h-full bg-slate-200"
        v-if="comment.replies?.length"
      ></div>
    </div>
    <div class="flex-1">
      <div class="flex items-center gap-4 justify-between">
        <span class="font-bold leading-none text-base">{{
          comment.user.username ?? 'Guest'
        }}</span>
        <FormsRatingField
          v-if="comment.rating"
          class="-mt-1 text-primary"
          :model-value="comment.rating"
          :select="false"
          :starWidth="22"
          :starHeight="22"
          :uniqueId="comment.id?.toString() ?? '' + id"
        />
      </div>
      <span class="text-xs text-gray-500 leading-none">{{
        timeAgo(comment.created_at)
      }}</span>
      <div class="mt-1 text-base" v-if="!isEditing">
        {{ comment.content }}
      </div>
      <textarea
        v-else
        v-model="editText"
        v-auto-resize
        class="w-full p-2 rounded-xl border border-[#DCCAB2] focus:outline-none resize-none scrollbar-hide overflow-hidden break-words min-h-16 mt-2"
        rows="2"
      ></textarea>

      <div class="mt-2 flex flex-wrap gap-2 text-sm">
        <button
          v-if="!isReply && !isEditing && !replying"
          class="animated-button bg-[#dccab25d] px-3 rounded-xl py-0.5"
          @click="startReply"
        >
          Reply
        </button>
        <div
          class="flex gap-2 flex-wrap flex-1 justify-end"
          v-if="canModify && !isEditing && !replying"
        >
          <button
            class="animated-button bg-[#dccab25d] px-3 rounded-xl py-0.5"
            @click="startEdit"
          >
            Edit
          </button>
          <button
            class="animated-button bg-red-200 px-3 rounded-xl py-0.5 text-red-800"
            @click="deleteThis"
          >
            Delete
          </button>
        </div>

        <template v-if="isEditing">
          <button
            class="animated-button bg-[#DCCAB2] px-4 rounded-xl py-0.5"
            @click="saveEdit"
          >
            Save
          </button>
          <button
            class="animated-button bg-[#dccab27c] px-4 rounded-xl py-0.5"
            @click="cancelEdit"
          >
            Cancel
          </button>
        </template>
      </div>

      <div v-if="replying && !isReply" class="mt-1 flex flex-col gap-2">
        <textarea
          v-model="replyText"
          v-auto-resize
          placeholder="Write a reply"
          class="w-full p-2 rounded-xl border border-slate-200 focus:outline-none resize-none scrollbar-hide overflow-hidden break-words min-h-16"
          rows="2"
        ></textarea>
        <div class="flex gap-2 justify-end">
          <button
            class="animated-button bg-[#dccab27c] px-4 rounded-xl py-0.5"
            @click="cancelReply"
          >
            Cancel
          </button>
          <button
            class="animated-button bg-[#DCCAB2] px-4 rounded-xl py-0.5"
            @click="submitReply"
          >
            Post reply
          </button>
        </div>
      </div>
      <div
        class="mt-6 flex flex-col gap-4"
        v-if="comment.replies?.length && !isReply"
      >
        <Comment
          :comment="reply"
          :id="id"
          :isReply="true"
          v-for="reply in comment.replies"
          :key="reply.id"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Comment } from '~/types/types';

const replying = ref(false);
const replyText = ref('');
const isEditing = ref(false);
const editText = ref('');

const props = defineProps({
  comment: {
    type: Object as PropType<Comment>,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  isReply: {
    type: Boolean,
    required: true,
  },
});
const auth = useAuthStore();
const recipe = useRecipeStore();

const canModify = computed(() => {
  const user = auth.user as any;
  return Boolean(
    user?.id && props.comment.user?.id && user.id === props.comment.user.id
  );
});

function startReply() {
  const user = auth.user as any;
  if (!user) {
    navigateTo('/login');
    return;
  }
  replying.value = true;
}

function cancelReply() {
  replying.value = false;
  replyText.value = '';
}

async function submitReply() {
  const user = auth.user as any;
  if (!user) {
    navigateTo('/login');
    return;
  }
  if (!props.comment.id) return;
  if (!replyText.value.trim()) return;

  await recipe.addNewComment({
    user,
    user_id: user.id,
    content: replyText.value.trim(),
    recipe_id: recipe.recipe?.id ?? props.comment.recipe_id,
    replying_to: props.comment.id,
    rating: null,
  });

  cancelReply();
}

function startEdit() {
  isEditing.value = true;
  editText.value = props.comment.content ?? '';
}

function cancelEdit() {
  isEditing.value = false;
  editText.value = '';
}

async function saveEdit() {
  if (!props.comment.id) return;
  const next = editText.value.trim();
  if (!next) return;
  await recipe.editCommentById(props.comment.id, next);
  cancelEdit();
}

async function deleteThis() {
  if (!props.comment.id) return;
  await recipe.deleteCommentById(props.comment.id);
}
</script>

<style scoped></style>
