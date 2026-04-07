<template>
  <canvas
    ref="canvasRef"
    class="block h-full w-full touch-none cursor-crosshair rounded-[28px] bg-white"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
    @pointercancel="onPointerUp"
  />
</template>

<script setup lang="ts">
type Point = {
  x: number;
  y: number;
};

type Stroke = Point[];

const canvasRef = ref<HTMLCanvasElement | null>(null);
const strokes = ref<Stroke[]>([]);
const activeStroke = ref<Stroke | null>(null);
const isDrawing = ref(false);

let resizeObserver: ResizeObserver | null = null;

function getCanvasMetrics() {
  const canvas = canvasRef.value;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  return {
    canvas,
    width: rect.width,
    height: rect.height,
    dpr: window.devicePixelRatio || 1,
  };
}

function getContext() {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  return ctx;
}

function configureContext(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
}

function resizeCanvas() {
  const metrics = getCanvasMetrics();
  if (!metrics) return;

  const { canvas, width, height, dpr } = metrics;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = getContext();
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redraw();
}

function redraw() {
  const ctx = getContext();
  const metrics = getCanvasMetrics();
  if (!ctx || !metrics) return;

  ctx.clearRect(0, 0, metrics.width, metrics.height);
  configureContext(ctx);

  for (const stroke of strokes.value) {
    drawStroke(ctx, stroke);
  }

  if (activeStroke.value) {
    drawStroke(ctx, activeStroke.value);
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.length === 0) return;
  const startPoint = stroke[0];
  if (!startPoint) return;

  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);

  if (stroke.length === 1) {
    ctx.lineTo(startPoint.x + 0.01, startPoint.y + 0.01);
  } else {
    for (let i = 1; i < stroke.length; i += 1) {
      const point = stroke[i];
      if (!point) continue;
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.stroke();
}

function getPoint(event: PointerEvent): Point | null {
  const canvas = canvasRef.value;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') {
    return;
  }

  const point = getPoint(event);
  if (!point) return;

  event.preventDefault();
  isDrawing.value = true;
  activeStroke.value = [point];
  canvasRef.value?.setPointerCapture?.(event.pointerId);
  redraw();
}

function onPointerMove(event: PointerEvent) {
  if (!isDrawing.value || !activeStroke.value) return;

  const point = getPoint(event);
  if (!point) return;

  event.preventDefault();
  activeStroke.value.push(point);
  redraw();
}

function onPointerUp(event?: PointerEvent) {
  if (!isDrawing.value || !activeStroke.value) return;

  if (event) {
    event.preventDefault();
    canvasRef.value?.releasePointerCapture?.(event.pointerId);
  }

  const finalizedStroke = [...activeStroke.value];
  if (finalizedStroke.length > 0) {
    strokes.value.push(finalizedStroke);
  }

  activeStroke.value = null;
  isDrawing.value = false;
  redraw();
}

function clear() {
  strokes.value = [];
  activeStroke.value = null;
  isDrawing.value = false;
  redraw();
}

function isEmpty() {
  return strokes.value.length === 0;
}

function exportDataUrl() {
  if (isEmpty()) return null;

  const points = strokes.value.flat();
  if (points.length === 0) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const padding = 24;
  const width = Math.max(1, Math.ceil(maxX - minX + padding * 2));
  const height = Math.max(1, Math.ceil(maxY - minY + padding * 2));
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');

  if (!exportCtx) return null;

  exportCanvas.width = width;
  exportCanvas.height = height;
  configureContext(exportCtx);

  const offsetX = padding - minX;
  const offsetY = padding - minY;

  for (const stroke of strokes.value) {
    const startPoint = stroke[0];
    if (!startPoint) continue;

    exportCtx.beginPath();
    exportCtx.moveTo(startPoint.x + offsetX, startPoint.y + offsetY);

    if (stroke.length === 1) {
      exportCtx.lineTo(startPoint.x + offsetX + 0.01, startPoint.y + offsetY + 0.01);
    } else {
      for (let i = 1; i < stroke.length; i += 1) {
        const point = stroke[i];
        if (!point) continue;
        exportCtx.lineTo(point.x + offsetX, point.y + offsetY);
      }
    }

    exportCtx.stroke();
  }

  return exportCanvas.toDataURL('image/png');
}

defineExpose({
  clear,
  isEmpty,
  exportDataUrl,
});

onMounted(() => {
  nextTick(() => {
    resizeCanvas();

    if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      resizeObserver.observe(canvasRef.value);
    }
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>
