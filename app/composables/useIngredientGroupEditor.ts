import type { TrackedMeal, EditableIngredient } from '~/types/types';

export function useIngredientGroupEditor(groups: Ref<TrackedMeal[]>) {
  const inputRefs = ref<Map<string, any>>(new Map());

  function setInputRef(groupIndex: number, ingredientIndex: number, el: any) {
    if (el) {
      inputRefs.value.set(`${groupIndex}-${ingredientIndex}`, el);
    } else {
      inputRefs.value.delete(`${groupIndex}-${ingredientIndex}`);
    }
  }

  function focusNext(groupIndex: number, ingredientIndex: number) {
    nextTick(() => {
      const nextIngredientIndex = ingredientIndex + 1;
      if (groups.value[groupIndex]?.editableIngredients[nextIngredientIndex]) {
        inputRefs.value.get(`${groupIndex}-${nextIngredientIndex}`)?.focus();
        return;
      }

      const nextGroupIndex = groupIndex + 1;
      if (
        groups.value[nextGroupIndex] &&
        !groups.value[nextGroupIndex].collapsed &&
        groups.value[nextGroupIndex].editableIngredients.length > 0
      ) {
        inputRefs.value.get(`${nextGroupIndex}-0`)?.focus();
        return;
      }

      // Ensure an empty input exists in the current group and focus it
      const group = groups.value[groupIndex];
      if (group) {
        const hasEmpty = group.editableIngredients.some((ing) => !ing.rawText.trim());
        if (!hasEmpty) {
          group.editableIngredients.push({ rawText: '', displayText: '' });
          nextTick(() => {
            const newIndex = group.editableIngredients.length - 1;
            inputRefs.value.get(`${groupIndex}-${newIndex}`)?.focus();
          });
        }
      }
    });
  }

  function deleteIngredient(groupIndex: number, ingredientIndex: number) {
    groups.value[groupIndex]?.editableIngredients.splice(ingredientIndex, 1);
  }

  function ensureOneEmptyInput() {
    for (const group of groups.value) {
      const hasEmpty = group.editableIngredients.some(
        (ing) => ing.rawText.trim() === '',
      );
      if (!hasEmpty) {
        group.editableIngredients.push({ rawText: '', displayText: '' });
      }
    }
  }

  function addGroup(name: string) {
    groups.value.push({
      name,
      editableIngredients: [{ rawText: '', displayText: '' }],
      collapsed: false,
    });
  }

  function removeGroup(index: number) {
    groups.value.splice(index, 1);
  }

  function emptyIngredient(): EditableIngredient {
    return { rawText: '', displayText: '' };
  }

  return {
    inputRefs,
    setInputRef,
    focusNext,
    deleteIngredient,
    ensureOneEmptyInput,
    addGroup,
    removeGroup,
    emptyIngredient,
  };
}
