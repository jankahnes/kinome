export function getProfileUrl(
  user?: { username?: string | null; id?: string | null } | null,
) {
  const profileKey = user?.username || user?.id;
  return profileKey ? `/profile/${encodeURIComponent(profileKey)}` : '/login';
}
