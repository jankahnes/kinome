import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export default defineEventHandler(async () => {
  const avatarDir = join(process.cwd(), 'public', 'avatars');

  try {
    const entries = await readdir(avatarDir, { withFileTypes: true });
    const avatars = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        path: `/avatars/${name}`,
      }));

    return { avatars };
  } catch {
    return { avatars: [] };
  }
});
