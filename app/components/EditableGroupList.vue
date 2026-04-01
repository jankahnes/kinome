<template>
  <div class="flex flex-col gap-2">
    <div v-for="(group, groupIndex) in groups" :key="groupIndex"
      class="flex flex-col main-card p-2 md:p-4">

      <!-- Group header: hidden for the default empty-name group when showGroupHeader=false -->
      <div
        v-if="showGroupHeader || group.name"
        class="flex items-center gap-2 justify-between pr-1 pb-2"
        :class="{ 'animated-button cursor-pointer': showCollapse }"
        @click="showCollapse ? (group.collapsed = !group.collapsed) : undefined">

        <!-- Editable group name -->
        <div class="relative flex mx-1">
          <span class="text-xl font-bold invisible whitespace-pre px-4 py-0.5" aria-hidden="true">
            {{ group.name || groupNamePlaceholder }}
          </span>
          <input
            v-model="group.name"
            class="text-xl font-bold focus:outline-none absolute inset-0 px-4 py-0.5 text-center bg-main/30 rounded-xl cursor-text!"
            :placeholder="groupNamePlaceholder"
            @click.stop />
        </div>

        <!-- Header actions -->
        <div class="flex items-center gap-2 text-gray-600">
          <NuxtLink
            v-if="group.recipe_id !== undefined"
            :to="`/recipe/${group.recipe_id}`"
            class="flex items-center justify-center rounded-md px-2 py-1 gap-1"
            @click.stop>
            <span class="text-xs hidden sm:block">Jump to recipe</span>
            <IconExternalLink class="w-5 text-base!" />
          </NuxtLink>
          <template v-if="showCollapse">
            <IconChevronDown class="w-5" v-if="group.collapsed" />
            <IconChevronUp class="w-5" v-else />
          </template>
          <button class="rounded-md p-1" @click.stop="removeGroup(groupIndex)">
            <IconTrash class="w-5" />
          </button>
        </div>
      </div>

      <!-- Ingredient rows (collapsible in tracking, always open in recipe) -->
      <div v-if="showCollapse" class="">
        <BlocksCollapsible v-model="group.collapsed" class="flex flex-col" reverse>
          <div
            v-for="(_, ingredientIndex) in group.editableIngredients"
            :key="`${groupIndex}-${ingredientIndex}`"
            class="">
            <ParsedIngredientInput
              :ref="(el: any) => setInputRef(groupIndex, ingredientIndex, el)"
              v-model="groups[groupIndex].editableIngredients[ingredientIndex]"
              @focus-next="focusNext(groupIndex, ingredientIndex)"
              @delete-ingredient="deleteIngredient(groupIndex, ingredientIndex)"
              :show-kcal="showKcal"
            />
          </div>
        </BlocksCollapsible>
      </div>
      <div v-else class="space-y-1">
        <div
          v-for="(_, ingredientIndex) in group.editableIngredients"
          :key="`${groupIndex}-${ingredientIndex}`"
          class="">
          <ParsedIngredientInput
            :ref="(el: any) => setInputRef(groupIndex, ingredientIndex, el)"
            v-model="groups[groupIndex].editableIngredients[ingredientIndex]"
            @focus-next="focusNext(groupIndex, ingredientIndex)"
            @delete-ingredient="deleteIngredient(groupIndex, ingredientIndex)"
            :show-kcal="showKcal"
          />
        </div>
      </div>
    </div>

    <!-- Add group footer -->
    <div v-if="addGroupLabel" class="flex gap-2 mt-2">
      <button
        class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10 text-lg"
        @click="addGroup(newGroupName)">
        <IconPlus class="w-4" />
        {{ addGroupLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const groups = defineModel<TrackedMeal[]>({ required: true });

const props = withDefaults(defineProps<{
  showCollapse?: boolean;
  showGroupHeader?: boolean;
  groupNamePlaceholder?: string;
  addGroupLabel?: string;
  newGroupName?: string;
  showKcal?: boolean;
}>(), {
  showCollapse: false,
  showGroupHeader: true,
  groupNamePlaceholder: 'Group name',
  addGroupLabel: '',
  newGroupName: '',
  showKcal: false,
});

const { setInputRef, focusNext, deleteIngredient, ensureOneEmptyInput, addGroup, removeGroup } =
  useIngredientGroupEditor(groups);

watch(
  groups,
  () => ensureOneEmptyInput(),
  { deep: true },
);
</script>
