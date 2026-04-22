<template>
  <div>
    <div class="flex flex-col items-center lg:ml-1 mb-20" v-if="recipeStore.recipe && recipeStore.recipe?.id === id">
      <NuxtImg class="w-full h-40 sm:h-64 object-cover  object-top opacity-90"
        :class="{ 'h-26!': !recipeStore.recipe?.picture }" src="/wood.png" alt="Light wooden background" />
      <NuxtImg v-if="recipeStore.recipe?.picture"
        class="-mt-36 h-50 sm:h-82 sm:-mt-60 shadow-[#00000038] filter-[drop-shadow(10px_10px_20px_var(--tw-shadow-color))_drop-shadow(0_0_10px_#00000015)]"
        :src="recipeStore.recipe?.picture" :alt="recipeStore.recipe?.title ?? 'Recipe picture'" />
      <!-- Central overview -->
      <div class="max-w-[850px] flex flex-col items-center text-center mx-2 lg:mx-8 mt-2"
        :class="{ 'mt-8!': !recipeStore.recipe?.picture }">
        <h1 class="leading-none text-4xl xl:text-6xl font-headers tracking-tight text-balance">
          {{ recipeStore.recipe?.title }}
        </h1>
        <p class="text-gray-600 mt-2 hidden xl:block">
          {{ recipeStore.recipe?.description }}
        </p>
        <p class="text-gray-600 mt-2 leading-snug block xl:hidden" v-if="mobileDescriptionExpanded"
          @click="mobileDescriptionExpanded = false">
          {{ recipeStore.recipe?.description }}
        </p>
        <p class="text-gray-600 mt-2 leading-snug block xl:hidden" v-else @click="mobileDescriptionExpanded = true">
          {{ mobileDescription }}...
          <span class="text-gray-600 text-sm cursor-pointer font-bold">Show more
          </span>
        </p>
        <p class="text-sm text-gray-400 mt-2 text-balance" v-if="originDisplay">
          <span v-if="originDisplay.type === 'traditional'" class="inline-flex items-center gap-1.5 align-middle">
            <span class="rounded-sm overflow-hidden flex items-center" v-for="flag in originDisplay.flags" :key="flag">
              <img :src="`/flags/${flag}.svg`" :alt="flag" class="h-4" />
            </span>
            <span>Traditional {{ originDisplay.cuisine }} Recipe </span>
          </span>
          <span v-else-if="originDisplay.type === 'media'" class="leading-none align-middle">By {{
            originDisplay.channel + " " }}</span>
          <span v-else-if="originDisplay.type === 'website'" class="leading-none align-middle">
            <span>From {{ originDisplay.website + " " }}</span>
          </span>
          <span v-else-if="originDisplay.type === 'user'" class="leading-none align-middle">
            <span>By <NuxtLink :to="getProfileUrl(recipeStore.recipe?.user)" class="cursor-pointer">{{
              recipeStore.recipe?.user?.username + " " }}</NuxtLink></span>
          </span>
          <span v-if="recipeStore.recipe?.based_on" class="leading-none align-middle">
            · {{ recipeStore.recipe?.variation_name }} of <NuxtLink
              :to="`/recipe/${recipeStore.recipe?.based_on_parent?.id}`" class="cursor-pointer font-bold">{{
                recipeStore.recipe?.based_on_parent?.title }}</NuxtLink>
          </span>
          <span v-else-if="originDisplay.type !== 'traditional'" class="leading-none align-middle">{{ " " }} · Original
            recipe</span>
          <span v-if="recipeStore.recipe?.variations?.length > 0" class="inline-flex items-center align-middle">
            <span class="mx-1">·</span>
            <button type="button" @click="variationsModalOpen = true"
              class="flex items-center hover:text-gray-600 transition-colors cursor-pointer leading-none">
              Variations
              <IconChevronRight class="w-4 -ml-px" :stroke-width="1.5" />
            </button>
          </span>
        </p>

        <p class="flex gap-2 mt-4">
          <button
            class="main-button animated-button bg-primary! text-white flex-1 flex justify-center items-center gap-2 py-0.5 font-semibold px-4"
            @click="cookModeOpen = true">
            <IconRocket class="w-6" :size="24" />
            Start Cooking
          </button>
          <button class="main-button animated-button flex justify-center items-center gap-1 px-2"
            v-if="effectiveSource && recipeStore.recipe?.source_type === 'MEDIA'" @click="scrollToWatchSection()">
            <IconChevronDown class="h-5" />
            <span class="leading-none font-semibold">Video</span>
          </button>
          <button v-if="!trackingAdded" class="flex justify-center items-center gap-2 p-1 text-slate-600"
            :class="{ 'opacity-60 cursor-not-allowed': trackingLoading }" :disabled="trackingLoading"
            title="Track this meal" @click="trackFromRecipePage">
            <IconLoaderCircle v-if="trackingLoading" class="w-5.5 animate-spin" />
            <IconNotebookPen v-else class="w-5.5" />
          </button>
          <button v-else
            class="rounded-2xl flex justify-center items-center gap-0.5 pt-0.5 px-3 bg-green-100/70 text-green-800"
            disabled>
            <IconCheck class="w-5" />
            <div class="flex flex-col items-start ml-2">
              <span class="text-lg leading-none">Tracked</span>
              <span class="leading-none text-[11px] -mt-0.5">Added to today</span>
            </div>
          </button>
          <button class="flex justify-center items-center gap-2 p-1 text-slate-600 transition-all duration-200" :class="{
            '': isBookmarked,
            'opacity-60 cursor-not-allowed': bookmarkLoading,
          }" :disabled="bookmarkLoading" :title="isBookmarked ? 'Remove bookmark' : 'Bookmark this recipe'"
            @click="toggleBookmark">
            <IconLoaderCircle v-if="bookmarkLoading" class="w-5.5 animate-spin" />
            <IconBookmark v-else class="w-6" :class="{ 'fill-current': isBookmarked }" />
          </button>
        </p>


        <div v-if="top7Tags.length > 0"
          class="flex gap-1.5 flex-wrap overflow-hidden py-0.5 text-sm mt-2 justify-center">
          <div v-if="recipeStore.recipe?.rating && recipeStore.recipe?.rating >= 4"
            class="flex items-center justify-center text-nowrap bg-primary/6 px-2 py-1 main-card-rounded leading-none gap-1">
            <FormsRatingField :model-value="recipeStore.recipe?.rating" :star-width="16" :star-height="16" :spacing="-1"
              :select="false" :uniqueId="`card-highlight-${recipeStore.recipe?.id}`" class="" />
            <span class="text-sm leading-none font-bold">{{ recipeStore.recipe?.rating?.toFixed(1) }}</span>
          </div>
          <div
            class="flex items-center justify-center text-nowrap bg-primary/6 px-2 py-1 main-card-rounded leading-none">
            <IconClock class="h-4" />
            <span class="text-sm leading-none">{{ getTotalTime(recipeStore.recipe?.total_time_mins,
              recipeStore.recipe?.effort) }}</span>
          </div>
          <div
            class="flex items-center justify-center text-nowrap bg-primary/6 px-2 py-1 main-card-rounded gap-2 leading-none"
            :class="specialTags.includes(tag?.id ?? 0) || tag?.id === 4
              ? 'bg-primary/8!'
              : ''
              " v-for="(tag, index) in top7Tags" :key="index">
            <img :src="`/${tag?.name}.webp`" :alt="tag?.name" class="h-4" v-if="specialTags.includes(tag?.id ?? 0)" />
            <IconDollarSign class="h-4 -mx-2" v-else-if="tag?.id === 4" />
            {{ tag?.name }}
          </div>
        </div>
      </div>
      <div class="max-w-[1200px] flex-col xl:flex-row flex gap-10 md:mt-14 mx-2 lg:mx-8 xl:items-start">
        <div class="contents xl:flex flex-col gap-8 flex-3">
          <PagesRecipeCookSteps :fullInstructions="recipeStore.recipe?.full_instructions ??
            recipeStore.recipe?.instructions?.map((i) => ({
              formatted_text: i,
            })) ??
            []
            " :ingredients="recipeStore.recipe?.ingredients" :servingSize="servingSize"
            :formalizationLoading="job?.step === 'formalizing_instructions'"
            v-model:markedIngredients="markedIngredients" class="hidden xl:block" ref="instructionListRef" />
          <div class="xl:hidden order-1">
            <div class="w-0 h-0" ref="mobileTabTarget"></div>
            <div
              class="flex gap-4 justify-between sticky top-0 bg-[#fffefb] md:bg-main p-4 rounded-b-4xl z-10 select-none cursor-pointer">
              <h2 class="text-3xl 2xs:text-4xl font-headers tracking-tight flex-1" @click="
                mobileTab = 'ingredients';
              scrollIntoView(mobileTabTarget);
              " :class="mobileTab === 'ingredients' ? '' : 'text-gray-300'">
                Ingredients
              </h2>
              <h2 class="text-3xl 2xs:text-4xl font-headers tracking-tight" @click="
                mobileTab = 'method';
              scrollIntoView(mobileTabTarget);
              " :class="mobileTab === 'method' ? '' : 'text-gray-300'">
                Method
              </h2>
            </div>
            <PagesRecipeCookSteps v-if="mobileTab === 'method'" v-model:markedIngredients="markedIngredients"
              :fullInstructions="recipeStore.recipe?.full_instructions ??
                recipeStore.recipe?.instructions?.map((i) => ({
                  formatted_text: i,
                })) ??
                []
                " :ingredients="recipeStore.recipe?.ingredients" :servingSize="servingSize"
              :formalizationLoading="job?.step === 'formalizing_instructions'" :hideHeader="true" />
            <PagesRecipeIngredientList v-if="mobileTab === 'ingredients'" :addedInfo="{
              addedFat: recipeStore.recipe?.added_fat ?? 0,
              addedSalt: recipeStore.recipe?.added_salt ?? 0,
              batchSize: recipeStore.recipe?.batch_size ?? 1,
            }" :ingredients="recipeStore.recipe?.ingredients"
              :baseIngredients="recipeStore.recipe?.base_ingredients ?? []"
              :batchSize="recipeStore.recipe?.batch_size ?? undefined" :recipeId="recipeStore.recipe?.id"
              v-model:servingSize="servingSize" :formalizationLoading="job?.step === 'formalizing_ingredients'"
              :price="recipeStore.recipe?.price ?? 0" :hideHeader="true" :metaPills="metaPills"
              @quick-edit-change="onQuickEditChange" @amounts-changed="onAmountsChanged"
              @tweak-drag-end="onTweakDragEnd" />
          </div>
          <div class="space-y-2 order-3 xl:order-0" v-if="recipeStore.recipe?.kcal">
            <div class="flex items-center gap-2 gap-y-1 justify-between flex-wrap">
              <h2 class="text-4xl font-headers tracking-tight leading-none ml-2">Nutrition</h2>
              <div class="flex gap-2">
                <button @click="contextMode = 'nutrition'; contextModalOpen = true"
                  class="bg-primary-5/80 flex items-center gap-0.5 main-button animated-button text-sm p-2">
                  <span class="">Full Nutrition</span>
                  <IconChevronRight class="w-5" />
                </button>
                <button @click="contextMode = 'health'; contextModalOpen = true"
                  class="bg-primary-5/80 flex items-center gap-0.5 main-button animated-button text-sm p-2">
                  <span class="">Full Analysis</span>
                  <IconChevronRight class="w-5" />
                </button>
              </div>
            </div>
            <div class="main-card-glass">
              <div class="flex flex-col xs:flex-row gap-3">
                <NutritionMacroCard :kcal="liveMacros.kcal" :carbohydrates="liveMacros.carbohydrates"
                  :protein="liveMacros.protein" :fat="liveMacros.fat"
                  class="main-card main-card-padding main-card-rounded flex-1" />
                <div v-if="liveHidx && liveHidx >= 41"
                  class="main-card main-card-padding main-card-rounded items-center justify-center flex-col gap-2 hidden xs:flex">
                  <GradeContainer :score="liveHidx" :type="'ovr'" class="text-4xl" />
                  <span class="text-sm text-slate-600">Health Grade</span>
                </div>
                <div v-if="liveHidx && liveHidx >= 41" class="flex xs:hidden justify-between main-card items-center ">
                  <span class="font-semibold text-lg mx-5">Health Grade</span>
                  <GradeContainer :score="liveHidx" :type="'ovr'" class="text-2xl" />
                </div>
              </div>
              <div class="relative mt-3" :class="{ 'overflow-hidden main-card-rounded': quickEditRecomputing }">
                <NutritionQualityCards :cards="getDailyQualityCards(liveReport, {
                  totalFat: liveMacros.fat,
                  protectiveScore: liveProtectiveScore,
                })" :gut-health="liveReport?.details?.gutHealth" :fat-profile="liveReport?.details?.fatProfile"
                  :fat-profile-readable="liveReport?.humanReadable?.fatProfile ?? []"
                  :micronutrients="liveReport?.details?.micronutrients" :kcal-progress="liveMacros.kcal / 2000"
                  mode="full" />
                <div v-if="quickEditRecomputing"
                  class="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/70 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
          <div class="space-y-2 order-4 xl:order-0" v-if="auth.isAdmin()">
            <h2 class="text-4xl font-headers tracking-tight ml-2 mb-2">Publish</h2>
            <PagesRecipePublishChecklist :recipe="recipeStore.recipe!" :refresh="async (r, f) => { }" />
          </div>
          <div class="space-y-2 order-5 xl:order-0">
            <h2 class="text-4xl font-headers tracking-tight ml-2 mb-2">
              {{
                recipeStore.recipe?.comments?.length
                  ? 'What others say'
                  : 'Comments'
              }}
            </h2>
            <PagesRecipeCommentSection :id="recipeStore.recipe?.id" />
          </div>
        </div>
        <div class="contents xl:block flex-2" :style="rightColumnStyle">
          <div class="contents xl:flex flex-col gap-8" ref="rightRailRef" :style="stickyStyle" :class="{
            'xl:sticky xl:top-4': shouldStick,
          }">
            <div>
              <PagesRecipeIngredientList :addedInfo="{
                addedFat: recipeStore.recipe?.added_fat ?? 0,
                addedSalt: recipeStore.recipe?.added_salt ?? 0,
                batchSize: recipeStore.recipe?.batch_size ?? 1,
              }" :ingredients="recipeStore.recipe?.ingredients"
                :baseIngredients="recipeStore.recipe?.base_ingredients ?? []"
                :batchSize="recipeStore.recipe?.batch_size ?? undefined" :recipeId="recipeStore.recipe?.id"
                v-model:servingSize="servingSize" class="hidden xl:block"
                :formalizationLoading="job?.step === 'formalizing_ingredients'" :price="recipeStore.recipe?.price ?? 0"
                ref="ingredientListRef" :metaPills="metaPills" :markedIngredients="markedIngredients"
                @quick-edit-change="onQuickEditChange" @amounts-changed="onAmountsChanged"
                @tweak-drag-end="onTweakDragEnd">
              </PagesRecipeIngredientList>
            </div>
            <div class="space-y-2 order-2 xl:order-0 main-card-rounded" :class="{ 'watch-flash': watchSectionFlashing }"
              v-if="effectiveSource && recipeStore.recipe?.source_type === 'MEDIA'">
              <h2 class="text-4xl font-headers tracking-tight ml-2 mb-2" ref="watchSectionTarget">Watch</h2>
              <div class="flex main-card main-card-padding main-card-rounded sm:gap-6">
                <div class="flex flex-col flex-1 justify-between ">
                  <div>
                    <a class="text-sm uppercase text-slate-400 tracking-tight" :href="effectiveSource ?? ''"
                      target="_blank">
                      Original video
                    </a>
                    <p class="text-xs text-slate-400 tracking-tight -mt-1">Uploaded {{ uploadDate }}</p>
                  </div>
                  <div class="flex flex-col gap-2 items-center p-4 -mx-6 bg-primary/8">
                    <img class="w-20 h-20 object-cover rounded-full opacity-80 shadow-[0_0_10px_#00000020]"
                      src="/neutral-avatar1.webp" alt="Guest avatar" />
                    <div class="flex items-center gap-2 bg-primary-5 px-3 rounded-3xl ">
                      <img :src="`/${getWebsiteName(effectiveSource)}.webp`" :alt="getWebsiteName(effectiveSource)"
                        class="h-4" />
                      <h3 class="text-lg font-headers tracking-tight truncate max-w-48">
                        {{ recipeStore.recipe?.video_metadata?.channel }}
                      </h3>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 pt-2 sm:pt-6">
                    <div class="flex flex-wrap gap-2 max-h-5 overflow-hidden">
                      <span class="text-sm text-blue-500" v-for="hashtag in (
                        recipeStore.recipe?.video_metadata?.tags ?? []
                      )?.tags ?? []" :key="hashtag">
                        #{{ hashtag }}
                      </span>
                    </div>
                    <div class="flex gap-2">
                      <span class=" bg-primary/8 px-2 py-1 rounded-3xl flex items-center gap-0.5 font-mono" v-if="
                        recipeStore.recipe?.video_metadata?.view_count
                      ">
                        <IconEye class="h-4" />
                        <span class="leading-none pt-0.5 text-xs uppercase">
                          {{
                            getSocialProof(
                              recipeStore.recipe?.video_metadata?.view_count,
                            )
                          }}
                        </span>
                      </span>
                      <span class=" bg-primary/8 px-2 py-1 rounded-3xl flex items-center gap-0.5 font-mono" v-if="
                        recipeStore.recipe?.video_metadata?.like_count
                      ">
                        <IconHeart class="h-4" />
                        <span class="leading-none pt-0.5 text-xs uppercase">
                          {{ getSocialProof(
                            recipeStore.recipe?.video_metadata?.like_count,
                          ) }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <iframe :src="embedSrc" title="Video" frameborder="0"
                  class="rounded-3xl self-center w-[150px] h-[270px] sm:w-[202px] sm:h-[360px]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
                  allowfullscreen v-if="embedSrc">
                </iframe>
              </div>
            </div>
            <div class="space-y-2 order-6 xl:order-0">
              <h2 class="text-4xl font-headers tracking-tight ml-2 mb-2">
                You might also like
              </h2>
              <div class="flex flex-col gap-3 ml-2">
                <RecipeCardHorizontal v-for="recipe in similarRecipes" :key="recipe.id" :recipe="recipe"
                  class="-ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <PagesRecipeCookMode v-model="cookModeOpen" :steps="recipeStore.recipe?.full_instructions ??
        recipeStore.recipe?.instructions?.map((i) => ({
          formatted_text: i,
        })) ??
        []
        " :ingredients="recipeStore.recipe?.ingredients" :title="recipeStore.recipe?.title" :servingSize="servingSize"
        :recipeId="recipeStore.recipe?.id" :totalTime="recipeStore.recipe?.total_time_mins ?? 0"
        :equipment="recipeStore.recipe?.equipment ?? []" />
      <BlocksResponsiveInfo v-if="recipeStore.recipe?.kcal && recipeStore.recipe?.hidx" v-model="contextModalOpen"
        :sidePanelClass="`w-${contextMode === 'health' ? '150' : '120'}`">
        <div v-if="contextMode === 'nutrition'" class="m-4">
          <h2 class="text-3xl font-headers tracking-tight mb-8">Full Nutrition</h2>
          <FoodFullNutritionFacts :recipe="recipeStore.recipe" class="mt-10" single-column show-macros
            subtitle='per serving' />
        </div>
        <PagesReport v-if="contextMode === 'health'" :id="recipeStore.recipe?.id?.toString() ?? ''" :isFood="false"
          :showTitle="true" class="m-3" />
      </BlocksResponsiveInfo>
      <PagesRecipeVariationsModal v-if="recipeStore.recipe?.id" v-model="variationsModalOpen"
        :variations="modalVariations" :currentId="recipeStore.recipe.id" />
      <Transition name="tweak-pill">
        <div v-if="tweakPillVisible"
          class="fixed left-1/2 -translate-x-1/2 bottom-[64px] sm:bottom-[24px] z-40 pointer-events-none">
          <div
            class="flex items-center gap-2 bg-[#fffefb]/85 backdrop-blur-md border border-slate-200/70 shadow-[0_4px_20px_#00000012] rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-tight text-slate-500">
            <span class="flex items-baseline gap-0.5">
              <RollingNumber :number="liveMacros.kcal" />
              <span class="opacity-60">kcal</span>
            </span>
            <span class="opacity-30">·</span>
            <span class="flex items-baseline gap-0.5">
              <RollingNumber :number="liveMacros.protein" /><span class="opacity-60">P</span>
            </span>
            <span class="opacity-30">·</span>
            <span class="flex items-baseline gap-0.5">
              <RollingNumber :number="liveMacros.carbohydrates" /><span class="opacity-60">C</span>
            </span>
            <span class="opacity-30">·</span>
            <span class="flex items-baseline gap-0.5">
              <RollingNumber :number="liveMacros.fat" /><span class="opacity-60">F</span>
            </span>
            <template v-if="liveHidx">
              <span class="opacity-30">·</span>
              <span class="flex items-baseline gap-1">
                <span class="opacity-60">Health </span>
                <span :class="gradeTextColors[getGrade(liveHidx, 'ovr')] ?? ''" class="font-semibold">
                  {{ getGrade(liveHidx, 'ovr') }}
                </span>
              </span>
            </template>
          </div>
        </div>
      </Transition>
    </div>
    <div v-else-if="recipeError" class="flex items-center justify-center h-screen">
      <div class="flex flex-col items-center justify-center gap-2">
        <IconAlertCircle class="w-10 h-10 text-red-500" />
        <h2 class="text-4xl font-bold tracking-tighter">Recipe not found</h2>
        <p class="text-lg text-gray-600">The recipe you are looking for does not exist.</p>
        <NuxtLink to="/" class="bg-primary-5/80 flex items-center gap-0.5 main-button animated-button text-sm p-2">
          <span>Go to homepage</span>
          <IconChevronRight class="w-5" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { getGrade, gradeColors, gradeTextColors } from '~/utils/constants/grades';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';

const route = useRoute();
const router = useRouter();
const recipeStore = useRecipeStore();
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 1280);
const mobileTab = ref<'method' | 'ingredients'>('ingredients');
const mobileDescriptionExpanded = ref(false);
const mobileDescription = computed(() => {
  return recipeStore.recipe?.description?.slice(0, 150);
});

const mobileTabTarget = ref<HTMLElement | null>(null);
const watchSectionTarget = ref<HTMLElement | null>(null);

const contextModalOpen = ref(false);
const contextMode = ref<'nutrition' | 'health'>('nutrition');
const variationsModalOpen = ref(false);
// List passed to VariationsModal: the full family (canonical + its variations).
// getRecipe already loads `recipe.variations` (children) and `recipe.based_on_parent`.
const modalVariations = computed<RecipeOverview[]>(() => {
  const r = recipeStore.recipe;
  if (!r) return [];
  const asOverview = r as unknown as RecipeOverview;
  if (!r.based_on) {
    // canonical: itself + its variations
    return [asOverview, ...((r.variations ?? []) as RecipeOverview[])];
  }
  // variation: parent (if loaded as overview) + self + any known siblings
  const list: RecipeOverview[] = [];
  const parent = r.based_on_parent as unknown as RecipeOverview | null;
  if (parent) list.push(parent);
  list.push(asOverview);
  for (const v of (r.variations ?? []) as RecipeOverview[]) list.push(v);
  return list;
});

const markedIngredients = ref<number[]>([]);


// Cook mode
const cookModeOpen = ref(false);

const effectiveSource = computed(() => {
  return recipeStore.recipe?.video_metadata?.url ?? recipeStore.recipe?.source;
});

const uploadDate = computed(() => {
  const raw = recipeStore.recipe?.video_metadata?.upload_date
  if (!raw) return '';
  const iso =
    /^\d{8}$/.test(raw)
      ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
      : raw;
  return timeAgo(iso);
});

const embedSrc = computed(() => {
  const src = effectiveSource.value;
  if (!src) return null;

  // Handle YouTube links
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    let videoId = '';
    try {
      if (src.includes('youtube.com')) {
        // e.g. https://www.youtube.com/watch?v=JbC14Zn7plU
        const url = new URL(src);
        videoId = url.searchParams.get('v') || '';
      } else if (src.includes('youtu.be')) {
        // e.g. https://youtu.be/JbC14Zn7plU
        // or https://youtu.be/JbC14Zn7plU?t=123
        const url = new URL(src);
        videoId = url.pathname.split('/')[1] || '';
      }
    } catch (e) {
      // fallback: try extracting after last slash
      videoId = src.split('/').pop() || '';
    }
    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  } else if (src?.includes('tiktok')) {
    return `https://www.tiktok.com/player/v1/${src.split('/').pop()}`;
  }
  return null;
});

const getWebsiteName = (source: string | null | undefined) => {
  if (!source) return '';
  const url = new URL(source);
  const parts = url.hostname.split('.');
  const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  return domain;
};

const getSocialProof = (number: number | null | undefined) => {
  if (!number) return '0';
  if (number >= 1000000) return `${Math.floor(number / 1000000)}M`;
  else if (number >= 1000) return `${Math.floor(number / 1000)}K`;
  else return number.toString();
};

// Tracking from recipe page
const {
  addMealFromRecipe,
  loadMeals,
  saveMeals,
  hasUnsavedChanges,
  selectedDate,
} = useMealTracking();
const trackingLoading = ref(false);
const trackingAdded = ref(false);

async function trackFromRecipePage() {
  if (!id || trackingAdded.value) return;
  trackingLoading.value = true;
  try {
    const today = new Date();
    selectedDate.value = today;
    await loadMeals(today);
    await addMealFromRecipe(id);
    hasUnsavedChanges.value = true;
    await saveMeals();
    trackingAdded.value = true;
  } catch (e) {
    console.error('Failed to track meal:', e);
  } finally {
    trackingLoading.value = false;
  }
}

// Refs for sticky behavior
const instructionListRef = ref<any>(null);
const ingredientListRef = ref<any>(null);
const rightRailRef = ref<HTMLElement | null>(null);

// Heights and sticky state
const instructionHeight = ref(0);
const ingredientHeight = ref(0);
const rightRailHeight = ref(0);
const containerTop = ref(0);
const maxScrollPosition = ref(0);
const scrollY = ref(0);

const topOffset = 16;
// Computed properties for sticky behavior
const shouldStick = computed(() => {
  if (isMobile.value) return false;
  return (
    ingredientHeight.value > 0 &&
    instructionHeight.value > 0 &&
    ingredientHeight.value < instructionHeight.value - topOffset
  );
});

const stickyStyle = computed(() => {
  if (!shouldStick.value) return {};
  const maxScroll =
    containerTop.value +
    instructionHeight.value -
    ingredientHeight.value -
    topOffset;

  if (scrollY.value >= maxScroll) {
    const offset = maxScroll - containerTop.value;
    return {
      position: 'relative' as const,
      top: `${offset + topOffset}px`,
    };
  }

  return {};
});

const rightColumnStyle = computed(() => {
  if (!shouldStick.value) return {};
  const needed = rightRailHeight.value + instructionHeight.value - ingredientHeight.value;
  return { 'min-height': `${needed}px` };
});

const measureHeights = () => {
  if (isMobile.value || !import.meta.client) return;

  nextTick(() => {
    const instructionComponent = instructionListRef.value;
    const ingredientComponent = ingredientListRef.value;
    const railEl = rightRailRef.value;

    if (!instructionComponent || !ingredientComponent) return;

    const instructionRoot = instructionComponent.root;
    const ingredientRoot = ingredientComponent.root;

    const instructionEl =
      instructionRoot?.value || instructionRoot || instructionComponent.$el;
    const ingredientEl =
      ingredientRoot?.value || ingredientRoot || ingredientComponent.$el;

    if (instructionEl && ingredientEl) {
      const instructionHeightNew =
        instructionEl.offsetHeight ||
        instructionEl.getBoundingClientRect().height;
      const ingredientHeightNew =
        ingredientEl.offsetHeight ||
        ingredientEl.getBoundingClientRect().height;

      if (instructionHeightNew > 0 && ingredientHeightNew > 0) {
        instructionHeight.value = instructionHeightNew;
        ingredientHeight.value = ingredientHeightNew;
        if (railEl) {
          rightRailHeight.value =
            railEl.offsetHeight || railEl.getBoundingClientRect().height;
        }

        // Use instruction element for containerTop - the right rail may be
        // in sticky position, which skews getBoundingClientRect
        const instructionRect = instructionEl.getBoundingClientRect();
        containerTop.value = instructionRect.top + window.scrollY;

        maxScrollPosition.value =
          containerTop.value +
          instructionHeight.value -
          ingredientHeight.value -
          topOffset;
      }
    }
  });
};

const paramValue = route.params.id as string;
const id = Number(paramValue.split('-')[0]);

const similarRecipes = ref<RecipeOverview[]>([]);

const getBudgetDescription = (price: number): string => {
  if (price >= 1) return `~$${Math.floor(price)}$ / serving`;
  else return `~${formatMoney(Math.round(price * 10) / 10)} / serving`;
};

// Serving size state - managed at page level for both IngredientList and InstructionContainer
const servingSize = ref(2); // Default to 2 servings

const specialTags = [102, 103, 107, 112];
const top7Tags = computed(() => {
  if (!recipeStore.recipe?.tags) return [];
  const tags = recipeStore.recipe.tags
    .map((tag) => { return { ...getTagByID(tag) } })
    .filter((tag) => tag?.id !== 112);
  tags?.sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));
  const budgetTag = tags.find((tag) => tag?.id === 4);
  if (budgetTag) {
    budgetTag.name = getBudgetDescription(recipeStore.recipe?.price ?? 0);
  }
  //extract special tags: vegan, vegetarian, gluten free, lactose free
  if (tags.some((tag) => tag?.id === 102)) {
    return tags.filter((tag) => tag?.id !== 103).slice(0, 6);
  }
  return tags.slice(0, 5);
});

const cuisines = ref([
  { name: 'basque', flags: ['es-pv'] },
  { name: 'eastern-european', flags: ['pl', 'cz', 'hu'] },
  { name: 'greek', flags: ['gr'] },
  { name: 'italian', flags: ['it'] },
  { name: 'korean', flags: ['kr'] },
  { name: 'malaysian', flags: ['my'] },
  { name: 'middle-eastern', flags: ['lb', 'tr', 'jo'] },
  { name: 'portuguese', flags: ['pt'] },
  { name: 'russian', flags: ['ru'] },
  { name: 'scandinavian', flags: ['se', 'no', 'dk'] },
  { name: 'thai', flags: ['th'] },
  { name: 'vietnamese', flags: ['vn'] },
  { name: 'german', flags: ['de'] },
  { name: 'american', flags: ['us'] },
  { name: 'indian', flags: ['in'] },
  { name: 'japanese', flags: ['jp'] },
  { name: 'chinese', flags: ['cn'] },
  { name: 'mexican', flags: ['mx'] },
  { name: 'spanish', flags: ['es'] },
  { name: 'turkish', flags: ['tr'] },
  { name: 'south-african', flags: ['za'] },
  { name: 'egyptian', flags: ['eg'] },
  { name: 'moroccan-maghreb', flags: ['ma', 'dz', 'tn'] },
  { name: 'west-african', flags: ['ng', 'gh', 'sn'] },
  { name: 'ethiopian', flags: ['et'] },
  { name: 'brazilian', flags: ['br'] },
  { name: 'british', flags: ['gb'] },
  { name: 'french', flags: ['fr'] },
]);

const displayType = computed(() => {
  if (
    recipeStore.recipe?.collection &&
    recipeStore.recipe?.collection.startsWith('traditional')
  )
    return 'cuisine';
  else if (recipeStore.recipe?.source_type === 'WEBSITE') return 'website';
  else if (recipeStore.recipe?.source_type === 'MEDIA') return 'creator';
  else if (recipeStore.recipe?.user_id) return 'user';
  return null;
});

const websiteName = computed(() => {
  const src = effectiveSource.value;
  if (!src) return '';
  const url = new URL(src);
  const parts = url.hostname.split('.');
  const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  return domain;
});

const originDisplay = computed(() => {
  const recipe = recipeStore.recipe;
  if (!recipe) return null;

  if (recipe.collection?.startsWith('traditional-')) {
    const cuisineSlug = recipe.collection.slice('traditional-'.length);
    const cuisine = cuisines.value.find((c) => c.name === cuisineSlug);
    return {
      type: 'traditional' as const,
      cuisine: cuisineSlug
        .split('-')
        .map((w) => capitalize(w))
        .join(' '),
      flags: cuisine?.flags ?? [],
    };
  }

  if (recipe.source_type === 'MEDIA' && recipe.video_metadata?.channel) {
    return {
      type: 'media' as const,
      channel: recipe.video_metadata.channel,
      platform: getWebsiteName(effectiveSource.value),
    };
  }

  if (recipe.source_type === 'WEBSITE' && recipe.source) {
    return {
      type: 'website' as const,
      website: capitalize(websiteName.value),
    };
  }

  if (recipe.user_id && recipe.user) {
    return {
      type: 'user' as const,
    };
  }

  return null;
});

const iconStyles = {
  youtube: 'w-4 h-3 my-1',
  tiktok: 'w-5 h-5',
  instagram: 'w-4 h-4 my-0.5',
};
const bgStyles = {
  youtube: 'bg-red-200/90',
  instagram: 'bg-yellow-100/90',
  tiktok: 'bg-gray-200/90',
};

const getCuisineDescription = (collection: string) => {
  if (displayType.value !== 'cuisine') return null;
  const cuisineName = collection.split('-')[1];
  const cuisine = cuisines.value.find(
    (cuisine) => cuisine.name === cuisineName,
  );
  return cuisine ?? null;
};

// Job polling
const jobId = ref(Number(route.query.poll as string) || null);
const { job, isPolling, error, start, stop, restart, fetchJob } = useJobPolling(
  jobId,
  supabase,
);

const loadingStore = useLoadingStore();

const loadingMessages = {
  formalizing_ingredients: 'Analyzing ingredients ✨',
  formalizing_instructions: 'Analyzing instructions ✨',
  pre_publish: 'Finishing up 🎉',
  '': '',
  idle: '',
} as Record<string, string>;

function onJobChange(newStep: string | null, oldStep: string | null) {
  if (newStep === 'formalizing_ingredients' && job.value?.message) {
    loadingStore.displayToast(job.value?.message);
  }
  else {
    loadingStore.displayToast(loadingMessages[newStep ?? ''] ?? '');
  }
  if (newStep !== oldStep && oldStep != null) {
    loadRecipeWithoutLoading();
    if (!newStep) {
      loadingStore.displayTransientToast('Done! 🎉');
      stop();
    }
  }
}

watch(
  () => job.value,
  (newStep, oldStep) => {
    if (newStep?.step !== oldStep?.step || newStep?.message !== oldStep?.message) {
      onJobChange(newStep?.step, oldStep?.step);
    }
  },
);

// Watch for redirect signal from detect-variation: when an import turns out
// to be a duplicate, the server deletes this recipe and sets
// jobs.redirect_recipe_id to the kept recipe id. We navigate there and clean
// up the job. The kept recipe can be either a canonical recipe or variation.
watch(
  () => (job.value as any)?.redirect_recipe_id as number | null | undefined,
  async (canonical) => {
    if (!canonical) return;
    const jobDbId = job.value?.id as number | undefined;
    stop();
    try {
      const canonicalOverviews = await getRecipeOverviews(supabase, {
        eq: { id: canonical },
      });
      const target = canonicalOverviews[0];
      if (jobDbId) {
        await supabase.from('jobs').delete().eq('id', jobDbId);
      }
      if (target) {
        loadingStore.displayTransientToast(
          'Recipe already exists, redirecting…'
        );
        navigateTo(getRecipeUrl(target.id, target.title ?? ''), {
          replace: true,
        });
      }
    } catch (err) {
      console.error('Failed to handle redirect_recipe_id:', err);
    }
  },
);

const {
  data: recipeData,
  error: recipeError,
  refresh: refreshRecipe,
} = await useAsyncData(
  `recipe-details-${id}`,
  () => getRecipe(supabase, { eq: { id } }),
  {
    lazy: import.meta.client,
  },
);

const isBookmarked = ref(false);
const bookmarkLoading = ref(false);



// Re-fetch recipe data without showing loading state (for job polling updates)
const loadRecipeWithoutLoading = async () => {
  await refreshRecipe();
};

// Set recipe in store and handle redirects
watchEffect(async () => {
  if (recipeData.value) {
    recipeStore.setRecipe(recipeData.value as Recipe);
    servingSize.value = recipeData.value.batch_size ?? 2;

    // Redirect from non-slugified URL to slugified URL
    if (recipeData.value.title && !paramValue.includes('-')) {
      navigateTo(getRecipeUrl(id, recipeData.value.title), { replace: true });
    }
    similarRecipes.value = await getRecipeOverviews(supabase, {
      neq: { id },
      or: 'picture.not.eq.null,source_type.eq.MEDIA',
      vector_search: {
        embedding: recipeData.value.embedding,
      },
      limit: 3,
    });
  }
});

const recipeUrl = computed(
  () =>
    `https://kinome.app${getRecipeUrl(
      recipeStore.recipe?.id ?? 0,
      recipeStore.recipe?.title ?? '',
    )}`,
);

const imageUrl = computed(
  () =>
    recipeStore.recipe?.picture ||
    recipeStore.recipe?.social_picture ||
    'https://kinome.app/feast.png',
);

const healthGrade = computed(() =>
  recipeStore.recipe?.hidx ? getGrade(recipeStore.recipe?.hidx, 'ovr') : null,
);

const description = computed(
  () =>
    `${recipeStore.recipe?.title} recipe nutrition facts: ${recipeStore.recipe?.kcal} kcal/100g, Nutrition Quality: ${healthGrade.value}. Discover in-depth nutritional analyis.`,
);

const jsonLd = computed(() => {
  const recipe = recipeStore.recipe;
  if (!recipe) return null;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    url: recipeUrl.value,
    image: imageUrl.value,
  };

  if (recipe.description) schema.description = recipe.description;
  if (recipe.created_at) schema.datePublished = recipe.created_at.split('T')[0];
  const channel = recipe.video_metadata?.channel as string | undefined;
  if (channel) {
    schema.author = {
      '@type': 'Organization',
      name: channel,
    };
  }
  const cookTimeMins =
    recipe.total_time_mins ??
    (recipe.effort === 'LIGHT'
      ? 20
      : recipe.effort === 'MODERATE'
        ? 35
        : recipe.effort === 'HEAVY'
          ? 60
          : null);
  if (cookTimeMins != null) schema.cookTime = `PT${cookTimeMins}M`;
  if (recipe.total_time_mins) schema.totalTime = `PT${recipe.total_time_mins}M`;
  if (recipe.batch_size) {
    schema.recipeYield = `${recipe.batch_size} serving${recipe.batch_size !== 1 ? 's' : ''}`;
  }
  const categoryTag = recipe.tags
    ?.map((tagId) => getTagByID(tagId))
    .find((tag) => tag && tag.id >= 200 && tag.id <= 209);
  if (categoryTag?.name) {
    schema.recipeCategory = capitalize(categoryTag.name.replace('main/', ''));
  }

  if (recipe.ingredients?.length) {
    schema.recipeIngredient = recipe.ingredients.map((ing) =>
      `
                        ${getStringFromIngredient(ing, recipe.batch_size ?? 1)}
                      `.trim(),
    );
  }
  const stripIngredientLinks = (instruction: string): string => {
    if (!instruction) return '';

    return instruction.replace(
      /\[([^\]]+)\]\(\d+\)/g,
      (_, ingredient) => ingredient
    ).replace(/\*([^*]+)\*/g, '$1');
  }
  if (recipe.full_instructions?.length) {

    schema.recipeInstructions = recipe.full_instructions.map(
      (step: CookStep) => ({
        '@type': 'HowToStep',
        text: stripIngredientLinks(step.formatted_text),
        ...(step.title ? { name: step.title } : {}),
      }),
    );
  } else if (recipe.instructions?.length) {
    schema.recipeInstructions = recipe.instructions.map((step: string) => ({
      '@type': 'HowToStep',
      text: stripIngredientLinks(step),
    }));
  }

  if (recipe.kcal != null) {
    const nutrition: Record<string, any> = {
      '@type': 'NutritionInformation',
      servingSize: '1 serving',
      calories: `${Math.round(recipe.kcal)} kcal`,
    };
    if (recipe.protein != null)
      nutrition.proteinContent = `${recipe.protein.toFixed(1)} g`;
    if (recipe.fat != null) nutrition.fatContent = `${recipe.fat.toFixed(1)} g`;
    if (recipe.carbohydrates != null)
      nutrition.carbohydrateContent = `${recipe.carbohydrates.toFixed(1)} g`;
    if (recipe.fiber != null)
      nutrition.fiberContent = `${recipe.fiber.toFixed(1)} g`;
    if (recipe.sugar != null)
      nutrition.sugarContent = `${recipe.sugar.toFixed(1)} g`;
    if (recipe.saturated_fat != null)
      nutrition.saturatedFatContent = `${recipe.saturated_fat.toFixed(1)} g`;
    schema.nutrition = nutrition;
  }

  if (recipe.rating_count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recipe.rating.toFixed(1),
      ratingCount: recipe.rating_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (recipe.price != null) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: recipe.price.toFixed(2),
    };
  }

  if (recipe.collection?.startsWith('traditional-')) {
    const cuisineSlug = recipe.collection.slice('traditional-'.length);
    schema.recipeCuisine = cuisineSlug
      .split('-')
      .map((w: string) => capitalize(w))
      .join(' ');
  }

  return schema;
});

defineOgImage('Recipe.takumi', {
  title: computed(() => recipeStore.recipe?.title ?? 'Recipe'),
  description: computed(() => recipeStore.recipe?.description ?? ''),
  picture: computed(
    () => recipeStore.recipe?.picture ?? recipeStore.recipe?.social_picture ?? null
  ),
  grade: healthGrade,
  pills: computed(() => {
    const r = recipeStore.recipe
    if (!r) return []
    const out: string[] = []
    if (r.rating && r.rating >= 4) out.push(`Rated ${r.rating.toFixed(1)}/5`)
    const time = getTotalTime(r.total_time_mins, r.effort)
    if (time) out.push(time)
    for (const t of top7Tags.value.slice(0, 3)) {
      if (t?.name) out.push(t.name)
    }
    return out.slice(0, 4)
  }),
})

useHead(() => ({
  title: `${recipeStore.recipe?.title} Recipe - Method & Nutrition | Kinome`,
  script: jsonLd.value
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }]
    : [],
  meta: [
    {
      name: 'description',
      content: description.value,
    },
    {
      property: 'og:title',
      content: `${recipeStore.recipe?.title} Recipe | Kinome`,
    },
    {
      property: 'og:description',
      content: description.value,
    },
    {
      property: 'og:type',
      content: 'article',
    },
    {
      property: 'og:url',
      content: recipeUrl.value,
    },
    {
      property: 'og:image',
      content: imageUrl.value,
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: `${recipeStore.recipe?.title} Recipe`,
    },
    {
      name: 'twitter:description',
      content: description.value,
    },
    {
      name: 'twitter:image',
      content: imageUrl.value,
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: recipeUrl.value,
    },
  ],
}));

const scrollIntoView = async (target: any, offset: number = 0) => {
  if (!target) return;

  let domElement: HTMLElement;
  if (target.$el) {
    domElement = target.$el;
  } else {
    domElement = target;
  }

  if (!domElement || !domElement.getBoundingClientRect) return;

  const targetRect = domElement.getBoundingClientRect();
  const targetTop = targetRect.top + window.pageYOffset;

  window.scrollTo({
    top: targetTop - offset,
    behavior: 'smooth',
  });
};

const watchSectionFlashing = ref(false);

const scrollToWatchSection = () => {
  if (!watchSectionTarget.value) return;

  if (!isMobile.value) {
    // On xl+: the Watch section is in the sticky right rail below the ingredient list.
    // The sticky behaviour makes getBoundingClientRect().top on the watch section stay
    // constant as the page scrolls, so a plain scrollIntoView undershoots. We correct
    // by adding the "overhang" - how much further the cook-steps column extends past
    // the bottom of the ingredient list (b2 - b1). If the ingredient list is already
    // longer (b1 >= b2) the stickiness isn't causing a problem, so we fall through to
    // the normal path.
    const ingredientComponent = ingredientListRef.value;
    const instructionComponent = instructionListRef.value;

    const ingredientRoot = ingredientComponent?.root;
    const instructionRoot = instructionComponent?.root;
    const ingredientEl: HTMLElement | null =
      ingredientRoot?.value || ingredientRoot || ingredientComponent?.$el || null;
    const instructionEl: HTMLElement | null =
      instructionRoot?.value || instructionRoot || instructionComponent?.$el || null;

    if (ingredientEl && instructionEl) {
      const b1 = ingredientEl.getBoundingClientRect().bottom;
      const b2 = instructionEl.getBoundingClientRect().bottom;

      if (b2 > b1) {
        let domElement: HTMLElement = (watchSectionTarget.value as any).$el ?? watchSectionTarget.value;
        const targetRect = domElement.getBoundingClientRect();
        const targetTop = targetRect.top + window.pageYOffset + (b2 - b1);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });

        setTimeout(() => {
          watchSectionFlashing.value = true;
          setTimeout(() => { watchSectionFlashing.value = false; }, 900);
        }, 700);
        return;
      }
    }
  }

  scrollIntoView(watchSectionTarget.value);

  setTimeout(() => {
    watchSectionFlashing.value = true;
    setTimeout(() => { watchSectionFlashing.value = false; }, 900);
  }, 700);
};

const handleScroll = () => {
  scrollY.value = window.scrollY;
};

let resizeObserver: ResizeObserver | null = null;

const initStickyBehavior = () => {
  if (!import.meta.client || typeof ResizeObserver === 'undefined') return;

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => {
    measureHeights();
  });

  const instructionComponent = instructionListRef.value;
  const ingredientComponent = ingredientListRef.value;
  const railEl = rightRailRef.value;

  if (instructionComponent?.root) {
    const instructionEl =
      instructionComponent.root?.value || instructionComponent.root;
    if (instructionEl) resizeObserver.observe(instructionEl);
  }

  if (ingredientComponent?.root) {
    const ingredientEl =
      ingredientComponent.root?.value || ingredientComponent.root;
    if (ingredientEl) resizeObserver.observe(ingredientEl);
  }

  if (railEl) resizeObserver.observe(railEl);

  measureHeights();
};

// Re-attach observers when components mount after lazy data load (client-side nav)
watch(
  () => instructionListRef.value,
  (val) => {
    if (val) nextTick(() => initStickyBehavior());
  },
  { flush: 'post' },
);

const fetchBookmarkStatus = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('bookmarks')
    .select('recipe_id')
    .eq('user_id', user.id)
    .eq('recipe_id', id)
    .maybeSingle();
  isBookmarked.value = data != null;
};

async function toggleBookmark() {
  if (!id || bookmarkLoading.value) return;
  bookmarkLoading.value = true;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await $fetch('/api/db/bookmark', {
      method: 'POST',
      body: {
        recipeId: id,
        bookmarked: !isBookmarked.value,
      },
    });
    await fetchBookmarkStatus();
  } catch (e) {
    console.error('Bookmark toggle failed:', e);
  } finally {
    bookmarkLoading.value = false;
  }
}

onMounted(async () => {
  fetchBookmarkStatus();
  if (
    !recipeStore.recipe?.picture &&
    recipeStore.recipe?.source_type === 'MEDIA'
  ) {
    recipeStore.recipe.social_picture = await recipeStore.getSocialPicture(
      effectiveSource.value ?? '',
    );
  }
  start();
  const { track, trackTimeSpent } = useEngagement();
  track(id, 'click');
  trackTimeSpent(id);

  if (auth.user?.id) {
    trackRecipeView(supabase, auth.user.id, id).catch(() => { });
  }

  // Set up sticky behavior
  scrollY.value = window.scrollY;
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', measureHeights, { passive: true });

  nextTick(() => initStickyBehavior());
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', measureHeights);
  resizeObserver?.disconnect();
});

const deleteRecipe = async () => {
  await $fetch('/api/db/delete-recipe', {
    method: 'POST',
    body: {
      recipeId: id,
    },
  });
  recipeStore.deleteRecipe(id);
  recipeStore.setRecipe({} as Recipe);
  router.push('/');
};



// Quick-edit (drag amounts) - lazy-hydrated food data + live nutrition
type FoodMacros = {
  kcal: number; protein: number; fat: number; carbohydrates: number;
  fiber: number; sugar: number; saturated_fat: number; salt: number;
  density?: number; countable_units?: Record<string, number>;
  protective_score?: number; hidx?: number;
};
const MACRO_KEYS = ['kcal', 'protein', 'fat', 'carbohydrates', 'fiber', 'sugar', 'saturated_fat', 'salt'] as const;
type MacroKey = typeof MACRO_KEYS[number];
const foodDataMap = ref<Record<number, FoodMacros>>({});
const quickEditActive = ref(false);
const quickEditRecomputing = ref(false);
const quickEditResult = ref<any | null>(null);
const baselineAbs = ref<Record<MacroKey, number> | null>(null);
const baselineTotalGrams = ref<number>(0);
let tweakDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let tweakAbortController: AbortController | null = null;

function computeAbsoluteTotals(ingredients: any[]) {
  const totals: Record<MacroKey, number> = {
    kcal: 0, protein: 0, fat: 0, carbohydrates: 0, fiber: 0, sugar: 0, saturated_fat: 0, salt: 0,
  };
  let totalGrams = 0;
  const size = servingSize.value ?? 1;
  for (const ing of ingredients ?? []) {
    const food = foodDataMap.value[ing.id];
    if (!food) continue;
    const info = ing.amountInfo?.[ing.currentUnit];
    if (!info) continue;
    const perServing = Number(info[0]);
    const unit = info[1];
    const amount = perServing * size;
    const density = (ing.density ?? food.density ?? 1) || 1;
    const unitWeight = ing.countable_units?.[unit] ?? food.countable_units?.[unit] ?? 0;
    const grams = convertToGrams(amount, unit, density, unitWeight);
    const effGrams = grams * (ing.consumption_factor ?? 1);
    totalGrams += effGrams;
    for (const k of MACRO_KEYS) {
      totals[k] += (effGrams * (Number(food[k]) || 0)) / 100;
    }
  }
  return { totals, totalGrams };
}

const liveAbsolute = computed(() => {
  if (!quickEditActive.value || !recipeStore.recipe?.ingredients) return null;
  return computeAbsoluteTotals(recipeStore.recipe.ingredients);
});

// recipe.kcal and the macro fields on the recipe row are stored per-serving.
// We scale the live per-serving sum by a per-nutrient normFactor to bridge any
// gap between our per-ingredient sum and the authoritative server value
// (cooking/processing adjustments live in the NutritionEngine, not here).
const liveMacros = computed(() => {
  const recipe = recipeStore.recipe;
  const fallback = {
    kcal: recipe?.kcal ?? 0,
    carbohydrates: recipe?.carbohydrates ?? 0,
    protein: recipe?.protein ?? 0,
    fat: recipe?.fat ?? 0,
  };
  if (!quickEditActive.value) return fallback;
  const live = liveAbsolute.value;
  const b = baselineAbs.value;
  if (!live || !b) return fallback;
  const size = servingSize.value ?? 1;
  if (size <= 0) return fallback;

  const scale = (key: 'kcal' | 'carbohydrates' | 'protein' | 'fat') => {
    const recipeValue = Number((recipe as any)?.[key] ?? 0);
    const baselinePerServing = b[key] / size;
    const livePerServing = live.totals[key] / size;
    if (baselinePerServing <= 0) return livePerServing;
    const nf = recipeValue / baselinePerServing;
    return livePerServing * nf;
  };

  return {
    kcal: scale('kcal'),
    carbohydrates: scale('carbohydrates'),
    protein: scale('protein'),
    fat: scale('fat'),
  };
});

const liveReport = computed(() => quickEditResult.value?.report ?? recipeStore.recipe?.report);
const liveHidx = computed(() => quickEditResult.value?.hidx ?? recipeStore.recipe?.hidx ?? 0);
const liveProtectiveScore = computed(() =>
  quickEditResult.value?.protective_score ?? recipeStore.recipe?.protective_score ?? 0
);

async function hydrateIngredientFoodData() {
  const ingredients = recipeStore.recipe?.ingredients ?? [];
  const needed = ingredients
    .map((i: any) => i.id)
    .filter((id: number) => !foodDataMap.value[id]);
  if (needed.length === 0) return;
  try {
    const foods = await getFoodNames(supabase, { in: { id: needed } });
    const next = { ...foodDataMap.value };
    for (const f of foods) {
      const food = (f as any).food;
      if (!food) continue;
      next[f.id] = {
        kcal: Number(food.kcal) || 0,
        protein: Number(food.protein) || 0,
        fat: Number(food.fat) || 0,
        carbohydrates: Number(food.carbohydrates) || 0,
        fiber: Number(food.fiber) || 0,
        sugar: Number(food.sugar) || 0,
        saturated_fat: Number(food.saturated_fat) || 0,
        salt: Number(food.salt) || 0,
        density: Number(food.density) || 1,
        countable_units: food.countable_units ?? {},
      };
    }
    foodDataMap.value = next;
  } catch (err) {
    console.error('Failed to hydrate ingredient food data:', err);
  }
}

const tweakPillVisible = ref(false);
let tweakPillHideTimer: ReturnType<typeof setTimeout> | null = null;

async function onQuickEditChange(active: boolean) {
  // Once tweaks are enabled, keep showing tweaked values even after the user
  // exits drag mode. Baseline is captured only once per recipe so the
  // normFactor stays stable across multiple Tweak/Done toggles - otherwise
  // re-entering after a tweak would recapture the new state as baseline and
  // break the relative math.
  if (active) {
    if (tweakPillHideTimer) {
      clearTimeout(tweakPillHideTimer);
      tweakPillHideTimer = null;
    }
    tweakPillVisible.value = true;
    if (!quickEditActive.value) {
      await hydrateIngredientFoodData();
      const base = computeAbsoluteTotals(recipeStore.recipe?.ingredients ?? []);
      baselineAbs.value = base.totals;
      baselineTotalGrams.value = base.totalGrams;
      quickEditActive.value = true;
    }
  } else {
    // On active=false (Done pressed): keep quickEditActive + baseline + quickEditResult
    // so the displayed nutrition/quality cards continue to reflect the tweaks.
    // The pill itself should fade away shortly after exit, though.
    if (tweakPillHideTimer) clearTimeout(tweakPillHideTimer);
    tweakPillHideTimer = setTimeout(() => {
      tweakPillVisible.value = false;
      tweakPillHideTimer = null;
    }, 1500);
  }
}

function resetQuickEditState() {
  quickEditActive.value = false;
  quickEditResult.value = null;
  quickEditRecomputing.value = false;
  baselineAbs.value = null;
  baselineTotalGrams.value = 0;
  tweakPillVisible.value = false;
  if (tweakPillHideTimer) {
    clearTimeout(tweakPillHideTimer);
    tweakPillHideTimer = null;
  }
  if (tweakDebounceTimer) clearTimeout(tweakDebounceTimer);
  tweakAbortController?.abort();
}

watch(
  () => recipeStore.recipe?.id,
  () => resetQuickEditState(),
);

function onAmountsChanged() {
  // Triggers reactivity - live macros recompute via computeds.
}

function onTweakDragEnd() {
  quickEditRecomputing.value = true;
  if (tweakDebounceTimer) clearTimeout(tweakDebounceTimer);
  tweakDebounceTimer = setTimeout(() => {
    recomputeRecipeFromTweaks();
  }, 250);
}

async function recomputeRecipeFromTweaks() {
  const recipe = recipeStore.recipe;
  if (!recipe) {
    quickEditRecomputing.value = false;
    return;
  }
  tweakAbortController?.abort();
  const controller = new AbortController();
  tweakAbortController = controller;
  try {
    const uploadable: any = JSON.parse(JSON.stringify(recipe));
    uploadable.ingredients = (uploadable.ingredients ?? [])
      .map((ing: any) => {
        const info = ing.amountInfo?.[ing.currentUnit];
        if (info) {
          ing.amount = Number(info[0]);
          ing.unit = info[1];
        }
        return ing;
      })
      .filter((ing: any) => Number(ing.amount) > 0);
    const computable = await convertUploadableToComputable(uploadable, supabase);
    const response: any = await $fetch('/api/calculate/recipe', {
      method: 'POST',
      signal: controller.signal,
      body: {
        nutritionEngineArgs: {
          recipe: computable,
          useGpt: false,
          logToReport: true,
          considerProcessing: true,
          disableSatiety: true,
          isDiet: false,
        },
      },
    });
    if (controller.signal.aborted) return;
    if (response?.recipeRow) {
      quickEditResult.value = response.recipeRow;
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.error('Tweak recompute failed:', err);
    }
  } finally {
    if (tweakAbortController === controller) {
      tweakAbortController = null;
    }
    if (!controller.signal.aborted) {
      quickEditRecomputing.value = false;
    }
  }
}

const metaGenerics: { name: string; value: number }[] = [
  { name: 'Vegetarian', value: 103 },
  { name: 'Vegan', value: 102 },
  { name: 'Gluten Free', value: 107 },
  { name: 'Lactose Free', value: 112 },
];

const metaPills = computed(() => {
  if (!recipeStore.recipe) return [];
  const pills = [];
  for (const generic of metaGenerics) {
    const hasGeneric = recipeStore.recipe.tags.includes(generic.value);
    pills.push({
      text: hasGeneric
        ? generic.name
        : generic.name == 'Gluten Free'
          ? 'Contains Gluten'
          : `Not ${generic.name}`,
      class: hasGeneric ? 'bg-green-100' : 'bg-red-50',
      icon: hasGeneric ? 'check' : 'x',
    });
  }
  return pills;
});
</script>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}

@keyframes watchFlash {
  0% {
    filter: brightness(1);
  }

  20% {
    filter: brightness(1.1);
  }

  100% {
    filter: brightness(1);
  }
}

.watch-flash {
  animation: watchFlash 0.8s ease-out;
}

.tweak-pill-enter-active,
.tweak-pill-leave-active {
  transition: opacity 0.25s ease, translate 0.25s ease;
}

.tweak-pill-enter-from,
.tweak-pill-leave-to {
  opacity: 0;
  translate: -50% 10px;
}

.tweak-pill-enter-to,
.tweak-pill-leave-from {
  opacity: 1;
  translate: -50% 0;
}
</style>
