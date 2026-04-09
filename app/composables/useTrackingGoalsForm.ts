type TrackingSectionForm = any;

type TrackingData = {
  biometrics?: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
    activityFactor?: number;
  };
  goal?: {
    targetWeightChange?: number;
    startDate?: string;
  };
  targets?: {
    kcal?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    sugar?: number;
    fiber?: number;
    salt?: number;
  };
};

export function useTrackingGoalsForm() {
  const supabase = useSupabaseClient<Database>();
  const auth = useAuthStore();

  const isValueValid = (value: string | null) =>
    value != null && value !== '' && !isNaN(Number(value)) && Number(value) >= 0;

  const currentStep = ref(1);

  const age = ref<string | null>(null);
  const gender = ref('Male');

  const selectedHeightUnit = ref<'cm' | 'ft'>('cm');
  const selectedWeightUnit = ref<'kg' | 'lb'>('kg');

  const heightCm = ref<string | null>(null);
  const heightFt = ref<string | null>(null);
  const heightInch = ref<string | null>(null);
  const weightInput = ref<string | null>(null);
  const selectedActivityCard = ref<number | null>(null);

  const selectedObjectiveCard = ref<number | null>(null);
  const selectedPaceIndex = ref<number | null>(1);
  const selectedPreference = ref<number | null>(0);

  const targetInputs = ref({
    kcal: {
      input: '1940',
      locked: true,
    },
    protein: {
      input: '150',
      locked: false,
      selectedUnit: 'g' as 'g' | '%',
    },
    carbohydrates: {
      input: '200',
      locked: false,
      selectedUnit: 'g' as 'g' | '%',
    },
    fat: {
      input: '60',
      locked: false,
      selectedUnit: 'g' as 'g' | '%',
    },
    fiber: {
      input: '',
    },
    sugar: {
      input: '',
    },
    salt: {
      input: '',
    },
  });

  const commonSuggestedTargets = ref({
    sugarLow: '',
    sugarWhoMax: '',
    fiberFDA: '',
    fiberHigh: '',
    saltLow: '3.5',
    saltWhoMax: '5',
  });

  const activityCards = [
    {
      title: 'Sedentary',
      description: 'Little or no exercise',
      illustration: '/tracking/activity/sedentary.png',
      value: 1.2,
    },
    {
      title: 'Lightly Active',
      description: '1-3 days/week',
      illustration: '/tracking/activity/lightly-active.png',
      value: 1.375,
    },
    {
      title: 'Moderately Active',
      description: '3-5 days/week',
      illustration: '/tracking/activity/active.png',
      value: 1.55,
    },
    {
      title: 'Very Active',
      description: '6-7 days/week',
      illustration: '/tracking/activity/very-active.png',
      value: 1.725,
    },
    {
      title: 'Extra Active',
      description: 'Physically demanding job',
      illustration: '/tracking/activity/extra-active.png',
      value: 1.9,
    },
  ];

  const objectiveCards = [
    {
      title: 'Lose Weight',
      description: 'Caloric Deficit',
      illustration: '/tracking/goal/lose.png',
      multiplier: -1,
    },
    {
      title: 'Maintain Weight',
      description: 'Caloric Balance',
      illustration: '/tracking/goal/maintain.png',
      multiplier: 0,
    },
    {
      title: 'Gain Muscle',
      description: 'Caloric Surplus',
      illustration: '/tracking/goal/gain.png',
      multiplier: 1,
    },
  ];

  const dietPills = [
    {
      title: 'Balanced',
      description: '35%P / 30%C / 30%F',
      value: {
        protein: 0.35,
        carbohydrates: 0.3,
        fat: 0.3,
      },
    },
    {
      title: 'High-Protein',
      description: '50%P / 30%C / 20%F',
      value: {
        protein: 0.5,
        carbohydrates: 0.3,
        fat: 0.2,
      },
    },
    {
      title: 'Low-Carb',
      description: '30%P / 10%C / 60%F',
      value: {
        protein: 0.3,
        carbohydrates: 0.1,
        fat: 0.6,
      },
    },
    {
      title: 'Low-Fat',
      description: '25%P / 55%C / 20%F',
      value: {
        protein: 0.25,
        carbohydrates: 0.55,
        fat: 0.2,
      },
    },
    {
      title: 'Keto',
      description: '20%P / 5%C / 75%F',
      value: {
        protein: 0.2,
        carbohydrates: 0.05,
        fat: 0.75,
      },
    },
  ];

  const sliderValues = [
    {
      title: 'Steady',
      value: 0.25,
      description: '0.25kg/week',
      illustration: '/tracking/pace/snail.png',
    },
    {
      title: 'Moderate',
      value: 0.5,
      description: '0.5kg/week',
      illustration: '/tracking/pace/horse.png',
    },
    {
      title: 'Fast',
      value: 0.75,
      description: '0.75kg/week',
      illustration: '/tracking/pace/rabbit.png',
    },
    {
      title: 'Aggressive',
      value: 1,
      description: '1kg/week',
      illustration: '/tracking/pace/cheetah.png',
    },
  ];

  const height = computed(() => {
    if (selectedHeightUnit.value === 'cm' && heightCm.value) {
      const parsedHeight = Number(heightCm.value);
      if (isNaN(parsedHeight) || parsedHeight <= 0) return null;
      return parsedHeight;
    }

    if (selectedHeightUnit.value === 'ft' && heightFt.value && heightInch.value) {
      const inches = Number(heightFt.value) * 12 + Number(heightInch.value);
      const parsedHeight = inches * 2.54;
      if (isNaN(parsedHeight) || parsedHeight <= 0) return null;
      return parsedHeight;
    }

    return null;
  });

  const weight = computed(() => {
    if (!weightInput.value) return null;
    return selectedWeightUnit.value === 'kg'
      ? Number(weightInput.value)
      : Number(weightInput.value) * 0.453592;
  });

  const activityLevel = computed(() => {
    if (selectedActivityCard.value == null) return 1;
    return activityCards[selectedActivityCard.value]?.value;
  });

  const macroDistribution = computed(() => {
    if (selectedPreference.value == null) {
      return { protein: 0.35, carbohydrates: 0.3, fat: 0.3 };
    }

    return dietPills[selectedPreference.value]?.value;
  });

  const targetWeightChange = computed(() => {
    if (selectedObjectiveCard.value == null || selectedPaceIndex.value == null) return 0;
    const multiplier = objectiveCards[selectedObjectiveCard.value]?.multiplier ?? 0;
    return multiplier * (sliderValues[selectedPaceIndex.value]?.value ?? 0);
  });

  const canContinueToStep2 = computed(() => {
    return (
      isValueValid(weightInput.value) &&
      !!height.value &&
      isValueValid(age.value) &&
      selectedActivityCard.value != null
    );
  });

  const canContinueToStep3 = computed(() => {
    return (
      selectedObjectiveCard.value != null &&
      selectedPaceIndex.value != null &&
      selectedPreference.value != null
    );
  });

  const canSubmit = computed(() => {
    return (
      isValueValid(targetInputs.value.kcal.input) &&
      isValueValid(targetInputs.value.protein.input) &&
      isValueValid(targetInputs.value.carbohydrates.input) &&
      isValueValid(targetInputs.value.fat.input) &&
      isValueValid(targetInputs.value.sugar.input) &&
      isValueValid(targetInputs.value.fiber.input) &&
      isValueValid(targetInputs.value.salt.input)
    );
  });

  function convertGramsToPercent(gramsInput: string, kcalPerGram: number) {
    const grams = Number(gramsInput);
    const kcal = Number(targetInputs.value.kcal.input);
    if (isNaN(grams) || isNaN(kcal) || kcal === 0) return '';
    return (((grams * kcalPerGram) / kcal) * 100).toFixed(0);
  }

  function convertPercentToGrams(percentInput: string, kcalPerGram: number) {
    const percent = Number(percentInput) / 100;
    const kcal = Number(targetInputs.value.kcal.input);
    if (isNaN(percent) || isNaN(kcal) || kcal === 0) return '';
    return ((percent * kcal) / kcalPerGram).toFixed(0);
  }

  function fillCommonSuggestedTargets() {
    const kcal = Number(targetInputs.value.kcal.input);
    if (isNaN(kcal) || kcal <= 0) return;
    commonSuggestedTargets.value.sugarLow = ((kcal * 0.05) / 4).toFixed(1);
    commonSuggestedTargets.value.sugarWhoMax = ((kcal * 0.1) / 4).toFixed(1);
    commonSuggestedTargets.value.fiberFDA = ((kcal * 14) / 1000).toFixed(1);
    commonSuggestedTargets.value.fiberHigh = ((kcal * 18) / 1000).toFixed(1);
  }

  function toggleMacroUnit(key: 'protein' | 'carbohydrates' | 'fat', kcalPerGram: number) {
    if (targetInputs.value[key].selectedUnit === 'g') {
      targetInputs.value[key].input = convertGramsToPercent(targetInputs.value[key].input, kcalPerGram);
      targetInputs.value[key].selectedUnit = '%';
      return;
    }

    targetInputs.value[key].input = convertPercentToGrams(targetInputs.value[key].input, kcalPerGram);
    targetInputs.value[key].selectedUnit = 'g';
  }

  function toggleProteinUnit() {
    toggleMacroUnit('protein', 4);
  }

  function toggleCarbohydrateUnit() {
    toggleMacroUnit('carbohydrates', 4);
  }

  function toggleFatUnit() {
    toggleMacroUnit('fat', 9);
  }

  function calculateTargets() {
    if (
      !weight.value ||
      !height.value ||
      !age.value ||
      !activityLevel.value ||
      !macroDistribution.value ||
      selectedPaceIndex.value == null ||
      targetWeightChange.value == null
    ) {
      return;
    }

    const genderConstant = gender.value === 'Male' ? 5 : -161;
    const bmr =
      10 * weight.value +
      6.25 * height.value -
      5 * Number(age.value) +
      genderConstant;
    const tdee = bmr * activityLevel.value;
    const kcalPerDayDiff = targetWeightChange.value * 1100;
    const targetKcal = tdee + kcalPerDayDiff;

    targetInputs.value.kcal.input = targetKcal.toFixed(0);
    targetInputs.value.protein.input = ((targetKcal * macroDistribution.value.protein) / 4).toFixed(0);
    targetInputs.value.fat.input = ((targetKcal * macroDistribution.value.fat) / 9).toFixed(0);
    targetInputs.value.carbohydrates.input = ((targetKcal * macroDistribution.value.carbohydrates) / 4).toFixed(0);
    targetInputs.value.protein.selectedUnit = 'g';
    targetInputs.value.carbohydrates.selectedUnit = 'g';
    targetInputs.value.fat.selectedUnit = 'g';
    fillCommonSuggestedTargets();
    targetInputs.value.sugar.input = commonSuggestedTargets.value.sugarWhoMax;
    targetInputs.value.fiber.input = commonSuggestedTargets.value.fiberFDA;
    targetInputs.value.salt.input = commonSuggestedTargets.value.saltWhoMax;
  }

  function formatMetricValue(value: number | undefined, digits = 0) {
    if (value == null || isNaN(value)) return null;
    return digits > 0 ? value.toFixed(digits) : value.toFixed(0);
  }

  function findClosestIndex(values: number[], target: number | undefined) {
    if (target == null || isNaN(target)) return null;
    let bestIndex = 0;
    let bestDistance = Infinity;
    values.forEach((value, index) => {
      const distance = Math.abs(value - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  function derivePreferenceIndexFromTargets(targets: TrackingData['targets']) {
    const kcal = targets?.kcal;
    const protein = targets?.protein;
    const carbohydrates = targets?.carbohydrates;
    const fat = targets?.fat;

    if (!kcal || protein == null || carbohydrates == null || fat == null) return 0;

    const distribution = {
      protein: (protein * 4) / kcal,
      carbohydrates: (carbohydrates * 4) / kcal,
      fat: (fat * 9) / kcal,
    };

    let bestIndex = 0;
    let bestDistance = Infinity;
    dietPills.forEach((pill, index) => {
      const distance =
        Math.abs(pill.value.protein - distribution.protein) +
        Math.abs(pill.value.carbohydrates - distribution.carbohydrates) +
        Math.abs(pill.value.fat - distribution.fat);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  function loadFromTrackingData(tracking: TrackingData | null | undefined) {
    if (!tracking) {
      fillCommonSuggestedTargets();
      return;
    }

    age.value = formatMetricValue(tracking.biometrics?.age);
    gender.value = tracking.biometrics?.gender === 'Female' ? 'Female' : 'Male';
    selectedHeightUnit.value = 'cm';
    selectedWeightUnit.value = 'kg';
    heightCm.value = formatMetricValue(tracking.biometrics?.height);
    heightFt.value = null;
    heightInch.value = null;
    weightInput.value = formatMetricValue(tracking.biometrics?.weight, 1);

    selectedActivityCard.value = findClosestIndex(
      activityCards.map((card) => card.value),
      tracking.biometrics?.activityFactor,
    );

    const change = tracking.goal?.targetWeightChange ?? 0;
    selectedObjectiveCard.value = change < 0 ? 0 : change > 0 ? 2 : 1;
    selectedPaceIndex.value = findClosestIndex(
      sliderValues.map((item) => item.value),
      Math.abs(change),
    ) ?? 1;
    selectedPreference.value = derivePreferenceIndexFromTargets(tracking.targets);

    targetInputs.value.kcal.input = formatMetricValue(tracking.targets?.kcal) ?? targetInputs.value.kcal.input;
    targetInputs.value.protein.input = formatMetricValue(tracking.targets?.protein) ?? targetInputs.value.protein.input;
    targetInputs.value.carbohydrates.input =
      formatMetricValue(tracking.targets?.carbohydrates) ?? targetInputs.value.carbohydrates.input;
    targetInputs.value.fat.input = formatMetricValue(tracking.targets?.fat) ?? targetInputs.value.fat.input;
    targetInputs.value.fiber.input = formatMetricValue(tracking.targets?.fiber, 1) ?? targetInputs.value.fiber.input;
    targetInputs.value.sugar.input = formatMetricValue(tracking.targets?.sugar, 1) ?? targetInputs.value.sugar.input;
    targetInputs.value.salt.input = formatMetricValue(tracking.targets?.salt, 1) ?? targetInputs.value.salt.input;

    targetInputs.value.protein.selectedUnit = 'g';
    targetInputs.value.carbohydrates.selectedUnit = 'g';
    targetInputs.value.fat.selectedUnit = 'g';
    fillCommonSuggestedTargets();
  }

  async function saveTracking() {
    if (!canSubmit.value || !auth.user) return false;

    const currentUser = auth.user as any;
    const existingUserData = currentUser.user_data as Record<string, any> | undefined;
    const userData: Record<string, any> = existingUserData
      ? Object.assign({}, existingUserData)
      : {};

    userData.tracking = {
      biometrics: {
        weight: weight.value!,
        height: height.value!,
        age: Number(age.value),
        gender: gender.value,
        activityFactor: activityLevel.value!,
      },
      goal: {
        targetWeightChange: targetWeightChange.value!,
        startDate: existingUserData?.tracking?.goal?.startDate ?? new Date().toISOString(),
      },
      targets: {
        kcal: Number(targetInputs.value.kcal.input),
        protein: Number(targetInputs.value.protein.input),
        carbohydrates: Number(targetInputs.value.carbohydrates.input),
        fat: Number(targetInputs.value.fat.input),
        sugar: Number(targetInputs.value.sugar.input),
        fiber: Number(targetInputs.value.fiber.input),
        salt: Number(targetInputs.value.salt.input),
      },
    };

    const { error } = await supabase
      .from('profiles')
      .update({ user_data: userData })
      .eq('id', auth.user.id);

    if (error) {
      console.error('Failed to save tracking:', error);
      return false;
    }

    await auth.fetchProfile();
    return true;
  }

  watch(
    () => targetInputs.value.kcal.input,
    () => {
      fillCommonSuggestedTargets();
    },
    { immediate: true },
  );

  return {
    currentStep,
    age,
    gender,
    selectedHeightUnit,
    selectedWeightUnit,
    heightCm,
    heightFt,
    heightInch,
    weightInput,
    selectedActivityCard,
    selectedObjectiveCard,
    selectedPaceIndex,
    selectedPreference,
    targetInputs,
    commonSuggestedTargets,
    activityCards,
    objectiveCards,
    dietPills,
    sliderValues,
    height,
    weight,
    activityLevel,
    macroDistribution,
    targetWeightChange,
    canContinueToStep2,
    canContinueToStep3,
    canSubmit,
    calculateTargets,
    convertGramsToPercent,
    toggleProteinUnit,
    toggleCarbohydrateUnit,
    toggleFatUnit,
    loadFromTrackingData,
    saveTracking,
  };
}

export type { TrackingSectionForm };
