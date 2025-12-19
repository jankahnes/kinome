export default function (fn: Function, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: any[] | undefined;
  let pending = false;

  return (...args: any[]) => {
    const isFirstCall = !timeoutId;
    lastArgs = args;

    if (isFirstCall) {
      fn(...args);
    } else {
      pending = true;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (pending && lastArgs) {
        fn(...lastArgs);
      }
      pending = false;
      timeoutId = undefined;
    }, delay);
  };
}
