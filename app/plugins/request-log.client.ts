export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client side
  if (process.server) return;

  let previousRoute: string | null = null;

  // Log initial page load
  nuxtApp.hook('app:mounted', () => {
    const currentRoute = window.location.href;
    logNavigation(null, currentRoute);
    previousRoute = currentRoute;
  });

  // Log route changes using page transition hook
  nuxtApp.hook('page:finish', () => {
    const currentRoute = window.location.href;
    const fromUrl = previousRoute;

    // Fire and forget - don't await
    logNavigation(fromUrl, currentRoute).catch((err) => {
      // Silently fail - we don't want logging errors to affect navigation
      console.error('Navigation logging failed:', err);
    });

    previousRoute = currentRoute;
  });
});

async function logNavigation(fromUrl: string | null, toUrl: string) {
  try {
    // Call API endpoint to log the navigation
    // Using fetch without await makes it fire-and-forget
    fetch('/api/log-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_url: fromUrl,
        to_url: toUrl,
        method: 'NAVIGATION',
        user_agent: navigator.userAgent,
        referer: document.referrer || null,
        host: window.location.host,
      }),
    }).catch(() => {
      // Silently fail - already fire and forget
    });
  } catch (error) {
    // Silently fail
  }
}
