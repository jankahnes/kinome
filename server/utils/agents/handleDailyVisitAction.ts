import { handleDailyVisit, getVisitStreaks } from '../gamification/service';

export default async function handleDailyVisitAction(
  client: any,
  personaUserId: string,
  payload: any,
) {
  const logicalDate =
    payload.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  await handleDailyVisit(client, personaUserId, logicalDate);
  const streaks = await getVisitStreaks(client, personaUserId, logicalDate);

  return {
    ok: true,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
}
