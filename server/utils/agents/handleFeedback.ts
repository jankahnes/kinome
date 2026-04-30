const ALLOWED_CATEGORIES = new Set([
  'confusing_ui',
  'bad_data',
  'broken_link',
  'wrong_info',
  'other',
]);

export default async function handleFeedback(
  client: any,
  personaUserId: string,
  payload: any,
) {
  const category: string = String(payload?.category ?? '').trim();
  const note: string = String(payload?.note ?? '').trim();
  const context: string | null =
    payload?.context != null ? String(payload.context).trim() : null;

  if (!ALLOWED_CATEGORIES.has(category)) {
    throw new Error(
      `Invalid category. Allowed: ${Array.from(ALLOWED_CATEGORIES).join(', ')}`,
    );
  }
  if (note.length < 3) throw new Error('note must be at least 3 characters');

  const insertRes = await (client as any).from('agent_feedback').insert({
    user_id: personaUserId,
    category,
    context: context && context.length > 0 ? context : null,
    note,
  });
  if (insertRes.error) {
    throw new Error(
      `Feedback insert failed: code=${(insertRes.error as any).code ?? '?'} message=${insertRes.error.message}`,
    );
  }

  return { result: 'Feedback recorded. Thanks for the report.' };
}
