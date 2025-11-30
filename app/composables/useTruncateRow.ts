import type { Ref } from 'vue';

/**
 * Composable to observe and track the height of an element using ResizeObserver.
 * Works with Vue component refs (which have a $el property) or direct HTMLElement refs.
 *
 * @param elementRef - A ref to a Vue component or HTMLElement, or an array of refs (uses first element)
 * @returns A ref containing the current height of the element
 */
export function useTruncateRow(
  elementRef: Ref<any | any[] | null | undefined>,
  padding: number = 0
): Ref<number> {
  const height = ref(padding);
  const ro = ref<ResizeObserver | null>(null);

  function measure() {
    const refValue = elementRef.value;
    if (!refValue) return;

    if (Array.isArray(refValue)) {
      const elements: HTMLElement[] = [];

      for (const ref of refValue) {
        if (ref) {
          const el =
            ref.$el instanceof HTMLElement
              ? ref.$el
              : ref instanceof HTMLElement
              ? ref
              : null;
          if (el) elements.push(el);
        }
      }

      if (elements.length === 0) return;

      const minTop = Math.min(...elements.map((el) => el.offsetTop));

      const firstRowElements = elements.filter(
        (el) => Math.abs(el.offsetTop - minTop) < 5
      );

      const maxHeight = Math.max(
        ...firstRowElements.map((el) => el.offsetHeight)
      );
      height.value = maxHeight + padding;
    } else {
      let element: HTMLElement | null = null;
      if (refValue.$el instanceof HTMLElement) {
        element = refValue.$el;
      } else if (refValue instanceof HTMLElement) {
        element = refValue;
      }

      if (element) {
        height.value = element.offsetHeight + padding;
      }
    }
  }

  onMounted(async () => {
    await nextTick();
    measure();
    ro.value = new ResizeObserver(measure);
  });

  watchEffect(() => {
    let element: Element | null = null;

    const refValue = elementRef.value;
    if (!refValue || !ro.value) return;

    if (Array.isArray(refValue)) {
      const firstRef = refValue[0];
      if (firstRef) {
        const el = firstRef.$el;
        element = el instanceof Element ? el : null;
      }
    } else {
      if (refValue.$el instanceof Element) {
        element = refValue.$el;
      } else if (refValue instanceof Element) {
        element = refValue;
      }
    }

    if (element) {
      ro.value?.observe(element);
    }
  });

  onBeforeUnmount(() => {
    ro.value?.disconnect();
  });

  return height;
}
