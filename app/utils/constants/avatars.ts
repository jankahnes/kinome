export const ACCOUNT_AVATARS = Array.from({ length: 10 }, (_, index) => {
  const name = `avatar${index + 1}.webp`;

  return {
    name,
    path: `/avatars/${name}`,
  };
});
