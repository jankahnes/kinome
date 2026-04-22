import { getStringFromAmountInfo } from './getStringFromAmountInfo';
import isCountable from './isCountable';
import pluralizeWord from './pluralizeWord';
import unitIsNoun from './unitIsNoun';

/** Matches the on-screen ingredient line in IngredientList (amount, optional “ of”, name, optional preparation). */
export function getIngredientDisplayName(
  ingredient: any,
  servingSize: number
): string {
  if (!ingredient?.amountInfo || !ingredient?.amountInfo.length) {
    return ingredient.name;
  }
  const amountInfo = ingredient?.amountInfo?.[ingredient?.currentUnit];
  if (!amountInfo) {
    return ingredient.name;
  }
  if (
    (isCountable(amountInfo[1]) || ingredient.countable_units?.[''] !== undefined) &&
    amountInfo[0] * (servingSize ?? 1) > 1 &&
    !unitIsNoun(amountInfo[1])
  ) {
    return pluralizeWord(ingredient.name);
  }
  return ingredient.name;
}

export function getStringFromIngredient(
  ingredient: any,
  servingSize: number = 1
): string {
  const amountStr = getStringFromAmountInfo(
    ingredient?.amountInfo?.[ingredient?.currentUnit],
    servingSize
  );
  const unit = ingredient?.amountInfo?.[ingredient?.currentUnit]?.[1];
  let out = amountStr;
  if (isCountable(unit) && unitIsNoun(unit)) {
    out += ' of';
  }
  out += ' ' + getIngredientDisplayName(ingredient, servingSize);
  if (ingredient?.preparation_description) {
    out += ', ' + ingredient.preparation_description;
  }
  return out;
}
