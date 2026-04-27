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
  const cookStreak = ref(1);

  function shouldResolveProfile(candidateUser: User | FullUser | null) {
    if (!candidateUser) return false;

    return (
      user.value?.id !== candidateUser.id ||
      !profileFetched.value ||
      !user.value?.username
    );
  }

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
        cookStreak.value = Math.max(1, res.currentStreak);
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
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const shouldFetchProfile = shouldResolveProfile(data.user);

      if (user.value?.id === data.user.id && user.value) {
        Object.assign(user.value, data.user);
      } else {
        user.value = data.user;
      }
      if (shouldFetchProfile) {
        await fetchProfile();
      } else if (data.user.is_anonymous) {
        profileFetched.value = true;
      }
    } else {
      await signInAnonymously();
    }

    userFetched.value = true;
  }

  function listenToAuthChanges() {
    if (authListenerSet.value) return;
    // Strictly synchronous: do NOT await or call any other supabase.auth.*
    // method here. Doing so re-enters the auth lock and deadlocks updateUser /
    // refreshSession. Every code path that mutates auth state (signIn, signUp,
    // signInAnonymously, fetchUser, OAuth callback) already calls fetchProfile
    // itself — this listener only mirrors the session into the store.
    supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;

      if (newUser) {
        if (user.value?.id === newUser.id && user.value) {
          Object.assign(user.value, newUser);
        } else {
          user.value = newUser;
          profileFetched.value = false;
        }
      } else {
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
    if (user.value?.is_anonymous) {
      try {
        await $fetch('/api/auth/convert-anonymous', {
          method: 'POST',
          body: { email, password },
        });
      } catch (error) {
        return { data: { user: null }, error };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data?.user) {
        if (user.value?.id === data.user.id && user.value) {
          Object.assign(user.value, data.user);
        } else {
          user.value = data.user;
        }
        profileFetched.value = false;
      }

      return { data, error };
    }

    suppressAnonymousAuth.value = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

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

    if (user.value?.is_anonymous) {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      });
      return { data, error };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    return { data, error };
  }

  async function signOut() {
    suppressAnonymousAuth.value = true;
    await supabase.auth.signOut();

    user.value = null;
    shoppingList.value = [];
    shoppingListOpen.value = false;
    cookStreak.value = 1;
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
    return user.value?.id === '4771c2f9-d8e8-44e7-967b-74d1f4468e23';
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
