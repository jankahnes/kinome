<template>
  <div class="max-w-3xl m-4 my-10 mx-auto flex flex-col gap-4 items-center">
    <h1 class="text-5xl font-headers">The Pantry</h1>
    <div class="flex gap-2 w-full">
      <div class="ai-ring main-card-rounded p-px flex items-center flex-1">
        <div class="flex items-center rounded-[31px] px-4 bg-primary-5 flex-1">
          <IconSearch class="w-4 " />
          <input type="text" :placeholder="'Search for a food'" v-model="foodResultsStore.searchQuery"
            @keyup.enter="search" @blur="search" class="text-xs focus:outline-none flex-1 px-2 py-[9px]" />
        </div>
      </div>
      <button class="main-button animated-button bg-primary-5 px-3 flex items-center justify-center shrink-0"
        @click="search">
        <IconSearch class="w-5" />
      </button>
      <button class="main-button animated-button bg-primary-5 px-3 flex items-center justify-center shrink-0"
        @click="navigateTo('/foods/new')">
        <IconPlus class="w-5" />
      </button>
      <button class="main-button animated-button bg-primary-5 px-3 flex items-center justify-center shrink-0"
        @click="navigateTo('/foods/scan')">
        <IconFlipHorizontal class="w-5" />
      </button>
    </div>
    <div class="flex flex-col gap-3 w-full mb-10">
      <NuxtLink
        class="flex gap-2 w-full bg-primary-5 pl-4 py-0 rounded-2xl overflow-hidden select-none cursor-pointer items-center"
        v-for="food in foodResultsStore.foodResults" :to="getFoodUrl(food.id, food.name)">
        <div class="flex-grow">
          <h2>{{ food.name }}</h2>
        </div>
        <GradeContainer :score="food.food.hidx ?? 0" :type="'ovr'" class="text-xl w-12! h-12!" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const supabase = useSupabaseClient<Database>();
const foodResultsStore = useFoodResultsStore();

useHead({
  title: 'Food Nutrition Database | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Search foods by name to compare nutrition data, health scores, calories, macros, and ingredient matches for recipes.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Food Nutrition Database | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content: 'Search foods by name to compare nutrition data, health scores, calories, macros, and ingredient matches for recipes.',
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'website',
    },
    {
      key: 'og:url',
      property: 'og:url',
      content: 'https://kinome.app/foods',
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: 'https://kinome.app/foods',
    },
  ],
});

const urlSearch = route.query.search as string;
if (urlSearch) {
  foodResultsStore.searchQuery = urlSearch;
  if (!foodResultsStore.foodResults.length) {
    search();
  }
} else if (foodResultsStore.searchQuery) {
  navigateTo(
    `/foods?search=${encodeURIComponent(foodResultsStore.searchQuery)}`,
    {
      replace: true,
    }
  );
} else {
  foodResultsStore.reset();
}

async function search() {
  if (!foodResultsStore.searchQuery) {
    foodResultsStore.reset();
    navigateTo('/foods', { replace: true });
    return;
  }
  const { data, error } = (await supabase.rpc('search_foods_deduplicated', {
    query: foodResultsStore.searchQuery,
    max: 10,
  })) as unknown as { data: Food[]; error: Error | null };
  //returned data: {food: food, matched_alias: string} -> map to {...food, name: matched_alias ?? food.name}
  if (error) {
    console.error(error);
  } else {
    foodResultsStore.setFoodResults(data, foodResultsStore.searchQuery);
    navigateTo(
      `/foods?search=${encodeURIComponent(foodResultsStore.searchQuery)}`,
      {
        replace: true,
      }
    );
  }
}
</script>

<style scoped></style>
