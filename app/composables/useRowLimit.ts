import type { Ref } from 'vue';

/**
 * Composable to limit items displayed based on row count in a flex/grid layout
 *
 * @param containerRef - Ref to the container element
 * @param cardBasis - The flex-basis width of each card (e.g., 240)
 * @param gap - Gap between cards in pixels (default: 16)
 * @param maxRows - Maximum number of rows to show (default: 2)
 * @returns Number of items to display
 */
export function useRowLimit(
  containerRef: Ref<HTMLElement | null | undefined>,
  cardBasis: number,
  gap: number = 16,
  maxRows: number = 2
): Ref<number> {
  const visibleItemCount = ref(0);

  function calculateVisibleItems() {
    const container = containerRef.value;
    if (!container) return;

    const containerWidth = container.offsetWidth;

    // Calculate how many items fit per row
    // Formula: floor((containerWidth + gap) / (cardBasis + gap))
    const itemsPerRow = Math.max(
      1,
      Math.floor((containerWidth + gap) / (cardBasis + gap))
    );

    visibleItemCount.value = itemsPerRow * maxRows;
  }

  onMounted(() => {
    nextTick(() => {
      calculateVisibleItems();
    });
  });

  // Recalculate on window resize
  addEventListener('resize', calculateVisibleItems);

  // Watch container ref changes
  watch(containerRef, () => {
    nextTick(() => {
      calculateVisibleItems();
    });
  });

  return visibleItemCount;
}
