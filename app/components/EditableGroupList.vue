<template>
  <div class="flex flex-col gap-6">
    <div v-for="(group, groupIndex) in groups" :key="groupIndex" class="flex flex-col">

      <!-- Group header: hidden for the default empty-name group when showGroupHeader=false -->
      <slot v-if="showGroupHeader || group.name !== null" name="group-header" :group="group" :group-index="groupIndex"
        :remove-group="() => removeGroup(groupIndex)">
        <div class="flex items-center gap-2 justify-between pr-1 pb-2" :class="{ 'cursor-pointer': showCollapse }"
          @click="showCollapse ? (group.collapsed = !group.collapsed) : undefined">

          <div class="relative flex mx-1">
            <span class="text-lg sm:text-xl font-headers invisible whitespace-pre px-4 py-0.5" aria-hidden="true">
              {{ group.name || groupNamePlaceholder }}
            </span>
            <input v-model="group.name"
              class="text-lg sm:text-xl font-headers focus:outline-none absolute inset-0 px-4 py-0.5 text-center bg-primary/8 rounded-xl cursor-text!"
              :placeholder="groupNamePlaceholder" @click.stop />
          </div>

          <div class="flex items-center gap-1 sm:gap-2 text-gray-600">
            <slot name="header-actions" :group="group" :group-index="groupIndex" />
            <NuxtLink v-if="group.recipe_id !== undefined" :to="`/recipe/${group.recipe_id}`"
              class="items-center justify-center rounded-md px-2 py-1 gap-1 hidden sm:flex" @click.stop>
              <IconExternalLink class="w-5 text-base! " />
            </NuxtLink>

            <button v-if="showRemoveButton" class="rounded-md p-1" @click.stop="removeGroup(groupIndex)">
              <IconTrash class="w-5" />
            </button>
            <template v-if="showCollapse">
              <IconChevronDown class="w-6" v-if="group.collapsed" />
              <IconChevronUp class="w-6" v-else />
            </template>
          </div>
        </div>
      </slot>

      <!-- Ingredient rows (collapsible in tracking, always open in recipe) -->
      <div v-if="showCollapse" class="">
        <BlocksCollapsible v-model="group.collapsed" class="flex flex-col gap-1" reverse>
          <div v-for="(_, ingredientIndex) in group.editableIngredients" :key="`${groupIndex}-${ingredientIndex}`"
            class="">
            <ParsedIngredientInput :ref="(el: any) => setInputRef(groupIndex, ingredientIndex, el)"
              v-model="groups[groupIndex]!.editableIngredients[ingredientIndex]!"
              @focus-next="focusNext(groupIndex, ingredientIndex)"
              @delete-ingredient="deleteIngredient(groupIndex, ingredientIndex)" :show-kcal="showKcal" />
          </div>
        </BlocksCollapsible>
      </div>
      <div v-else class="space-y-1">
        <div v-for="(_, ingredientIndex) in group.editableIngredients" :key="`${groupIndex}-${ingredientIndex}`"
          class="">
          <ParsedIngredientInput :ref="(el: any) => setInputRef(groupIndex, ingredientIndex, el)"
            v-model="groups[groupIndex]!.editableIngredients[ingredientIndex]!"
            @focus-next="focusNext(groupIndex, ingredientIndex)"
            @delete-ingredient="deleteIngredient(groupIndex, ingredientIndex)" :show-kcal="showKcal" />
        </div>
      </div>
    </div>

    <!-- Add group footer -->
    <div v-if="addGroupLabel" class="flex gap-2">
      <button class="main-button animated-button flex items-center gap-2 px-4 py-1 main-card"
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
  showRemoveButton?: boolean;
}>(), {
  showCollapse: false,
  showGroupHeader: true,
  groupNamePlaceholder: 'Group name',
  addGroupLabel: '',
  newGroupName: '',
  showKcal: false,
  showRemoveButton: true,
});

const { setInputRef, focusNext, deleteIngredient, ensureOneEmptyInput, addGroup, removeGroup } =
  useIngredientGroupEditor(groups);

watch(
  groups,
  () => ensureOneEmptyInput(),
  { deep: true },
);
</script>
