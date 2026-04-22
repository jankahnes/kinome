import { todayLogicalDate } from '~/utils/format/logicalDate';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<FullUser | null>(null);
  const authListenerSet = ref(false);
  const userFetched = ref(false);
  const profileFetched = ref(false);
  const suppressAnonymousAuth = ref(false);
  const supabase = useSupabaseClient<Database>();
  const shoppingList = ref<ShoppingListItem[]>([]);
  const shoppingListOpen = ref(false);
  const cookStreak = ref(0);

  async function fetchProfile() {
    const userId = user.value?.id;
    if (!userId) {
      profileFetched.value = true;
      return;
    }

    profileFetched.value = false;
    try {
      const profile = await getUser(supabase, userId);
      if (profile && user.value?.id === userId) {
        Object.assign(user.value, profile);
        // Load shopping list from profile
        if (profile.shopping_list) {
          shoppingList.value = profile.shopping_list as ShoppingListItem[];
        }
        registerDailyVisit();
      }
    } catch (error) {
      console.error('fetchProfile failed', error);
    } finally {
      if (!user.value || user.value.id === userId) {
        profileFetched.value = true;
      }
    }
  }

  async function registerDailyVisit() {
    if (!user.value?.username || !user.value?.id) return;
    try {
      const res = await $fetch<{
        success: boolean;
        currentStreak: number;
        longestStreak: number;
      }>('/api/db/visit', {
        method: 'POST',
        body: { date: todayLogicalDate() },
      });
      if (typeof res?.currentStreak === 'number') {
        cookStreak.value = res.currentStreak;
      }
    } catch (e) {
      console.warn('registerDailyVisit failed', e);
    }
  }

  async function signInAnonymously() {
    if (suppressAnonymousAuth.value) return;
    const { data: anonData, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Failed to sign in anonymously:', error);
    }
    if (anonData.user) {
      user.value = anonData.user;
      await fetchProfile();
    }
  }

  async function fetchUser() {
    if (userFetched.value) return;
    console.log('fetchUser');
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const shouldFetchProfile =
        user.value?.id !== data.user.id || !profileFetched.value || !user.value?.username;

      if (user.value?.id === data.user.id && user.value) {
        Object.assign(user.value, data.user);
      } else {
        user.value = data.user;
      }
      console.log('fetchUser: user', user.value);
      if (shouldFetchProfile) {
        await fetchProfile();
      }
    } else {
      console.log('fetchUser: signInAnonymously');
      await signInAnonymously();
    }

    userFetched.value = true;
  }

  function listenToAuthChanges() {
    if (authListenerSet.value) return;
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      const shouldResolveProfile =
        !!newUser &&
        (user.value?.id !== newUser.id || !profileFetched.value || !user.value?.username);

      if (newUser) {
        if (user.value?.id === newUser.id && user.value) {
          Object.assign(user.value, newUser);
        } else {
          user.value = newUser;
        }
        console.log('listenToAuthChanges: user', user.value);
        if (shouldResolveProfile) {
          await fetchProfile();
        }
      } else if (user.value?.id && !suppressAnonymousAuth.value) {
        await signInAnonymously();
        console.log('listenToAuthChanges: signInAnonymously');
      } else if (!newUser && suppressAnonymousAuth.value) {
        user.value = null;
        profileFetched.value = true;
      }
    });

    authListenerSet.value = true;
  }

  async function resolveEmail(identifier: string) {
    const trimmedIdentifier = identifier.trim();
    if (trimmedIdentifier.includes('@')) return trimmedIdentifier;

    const lookup = await $fetch<{ emailForUsername: string | null }>(
      '/api/auth/lookup',
      {
        method: 'POST',
        body: { username: trimmedIdentifier },
      },
    );

    if (!lookup.emailForUsername) {
      throw new Error('No account found for that username');
    }

    return lookup.emailForUsername;
  }

  async function signIn(identifier: string, password: string) {
    const email = await resolveEmail(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data?.user) {
      user.value = data.user;
      await fetchProfile();
    }
    return { data, error };
  }

  async function signUp(email: string, password: string) {
    suppressAnonymousAuth.value = true;

    try {
      if (user.value?.is_anonymous) {
        await supabase.auth.signOut();
        user.value = null;
        profileFetched.value = true;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (data?.user) {
        user.value = data.user;
        profileFetched.value = false;
      }

      return { data, error };
    } finally {
      suppressAnonymousAuth.value = false;
      if (!user.value) {
        await signInAnonymously();
      }
    }
  }

  async function signInWithGoogle(redirectTo = '/') {
    const origin = import.meta.client ? window.location.origin : '';
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
    return { data, error };
  }

  async function signOut() {
    suppressAnonymousAuth.value = true;
    await supabase.auth.signOut();

    user.value = null;
    shoppingList.value = [];
    shoppingListOpen.value = false;
    cookStreak.value = 0;
    profileFetched.value = false;

    suppressAnonymousAuth.value = false;
    await signInAnonymously();
  }

  function isUser() {
    return user.value && !user.value.is_anonymous && user.value.username;
  }

  async function syncShoppingList() {
    if (!user.value?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ shopping_list: shoppingList.value })
      .eq('id', user.value.id);

    if (error) console.error('Failed to sync shopping list:', error);
  }

  async function addToShoppingList(
    ingredients: any[],
    recipeId: number,
    servingSize: number,
  ) {
    if (!ingredients || ingredients.length === 0) return;
    for (const ingredient of ingredients) {
      const amount = ingredient.amount * servingSize;
      const existingIndex = shoppingList.value.findIndex(
        (item) => item.ingredientId === ingredient.id,
      );

      if (existingIndex !== -1) {
        // Aggregate: convert to grams if units differ
        const existing = shoppingList.value[existingIndex];
        const existingGrams = convertToGrams(
          existing.amount,
          existing.unit,
          ingredient.density || 1,
          ingredient.countable_units[existing.unit] || 0,
        );
        const newGrams = convertToGrams(
          amount || 0,
          ingredient.unit ?? 'G',
          ingredient.density || 1,
          ingredient.countable_units[ingredient.unit] || 0,
        );

        existing.amount = existingGrams + newGrams;
        existing.unit = 'G';
        if (!existing.recipeIds.includes(recipeId)) {
          existing.recipeIds.push(recipeId);
        }
      } else {
        // Add new item
        shoppingList.value.push({
          ingredientId: ingredient.id,
          name: ingredient.name,
          amount: amount || 0,
          unit: ingredient.unit ?? 'G',
          aisle: ingredient.aisle || null,
          price: ingredient.price || null,
          recipeIds: [recipeId],
          addedAt: Date.now(),
          unit_weight: ingredient.countable_units?.[ingredient.unit] || 0,
          density: ingredient.density || 1,
        });
      }
    }
    shoppingListOpen.value = true;
    await syncShoppingList();
  }

  async function removeFromShoppingList(ingredientId: number) {
    shoppingList.value = shoppingList.value.filter(
      (item) => item.ingredientId !== ingredientId,
    );
    if (shoppingList.value.length === 0) {
      shoppingListOpen.value = false;
    }
    await syncShoppingList();
  }

  async function clearShoppingList() {
    shoppingListOpen.value = false;
    shoppingList.value = [];
    await syncShoppingList();
  }

  function isAdmin() {
    return user.value?.id == '4771c2f9-d8e8-44e7-967b-74d1f4468e23';
  }

  return {
    user,
    authListenerSet,
    userFetched,
    shoppingList,
    profileFetched,
    cookStreak,
    registerDailyVisit,
    fetchProfile,
    fetchUser,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    listenToAuthChanges,
    isUser,
    isAdmin,
    addToShoppingList,
    removeFromShoppingList,
    clearShoppingList,
    syncShoppingList,
    shoppingListOpen,
  };
});
