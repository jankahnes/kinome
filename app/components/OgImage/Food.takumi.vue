<template>
  <div :style="{
    width: '1200px',
    height: '630px',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(140deg, #fffaf7 0%, #fbeadf 55%, #f4d9d0 100%)',
    fontFamily: 'Inter, sans-serif',
    color: '#1e293b',
    padding: '50px 64px 64px 64px',
    position: 'relative',
  }">
    <!-- Top bar -->
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '16px',
        letterSpacing: '0.14em',
        color: '#CF6139',
        textTransform: 'uppercase',
        fontWeight: 400,
      }">
        <div :style="{ width: '28px', height: '2px', background: '#CF6139' }" />
        <span>Kinome | Food</span>
      </div>
      <div :style="{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#94a3b8',
      }">
        {{ aisle }}
      </div>
    </div>

    <!-- Main row -->
    <div style="display: flex; flex: 1; align-items: center; gap: 56px;">
      <!-- Illustration disc -->
      <div :style="{
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }">
        <img v-if="illustration" :src="takumiImageSrc(illustration)"
          :style="{ width: '190px', height: '190px', objectFit: 'contain' }" />
        <div v-else :style="{
          fontFamily: 'Fraunces, serif',
          fontSize: '140px',
          color: 'rgba(207, 97, 57, 0.45)',
          fontWeight: 400,
        }">
          {{ name.charAt(0) }}
        </div>
      </div>

      <!-- Title + grade -->
      <div style="display: flex; flex-direction: column; flex: 1;">
        <h1 :style="{
          fontFamily: 'Fraunces, serif',
          fontSize: name.length > 20 ? '76px' : '96px',
          lineHeight: '0.95',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#1a1208',
          margin: 0,
          overflow: 'hidden',
          maxHeight: name.length > 20 ? '145px' : '182px',
        }">
          {{ name }}
        </h1>

        <div v-if="grade" style="display: flex; align-items: center; gap: 16px; margin-top: 24px;">
          <div :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Fraunces, serif',
            fontWeight: 600,
            fontSize: '42px',
            width: '78px',
            height: '78px',
            borderRadius: '20px',
            background: gradeBg,
            color: gradeFg,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }">
            {{ grade }}
          </div>
          <div style="display: flex; flex-direction: column;">
            <div :style="{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#94a3b8',
            }">
              Health Grade
            </div>
            <div style="font-size: 20px; font-weight: 600; color: #334155; margin-top: 2px;">
              {{ gradeLabel }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Macro strip -->
    <div :style="{
      display: 'flex',
      background: 'rgba(255,255,255,0.72)',
      borderRadius: '28px',
      padding: '22px 32px',
      gap: '16px',
    }">
      <div v-for="(m, i) in macros" :key="m.label" :style="{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: i < macros.length - 1 ? '1px solid rgba(148,163,184,0.25)' : 'none',
      }">
        <div :style="{
          fontFamily: 'Fraunces, serif',
          fontSize: '38px',
          fontWeight: 400,
          color: m.color,
          lineHeight: 1,
        }">
          {{ m.value }}<span
            style="font-size: 18px; color: #94a3b8; font-family: Inter, sans-serif; font-weight: 400; margin-left: 2px;">{{
              m.unit }}</span>
        </div>
        <div :style="{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#94a3b8',
          marginTop: '6px',
        }">
          {{ m.label }}
        </div>
      </div>
    </div>

    <div :style="{
      position: 'absolute',
      bottom: '34px',
      right: '64px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      color: '#94a3b8',
      letterSpacing: '0.08em',
    }">
      per 100g | kinome.app
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name?: string
    aisle?: string
    illustration?: string | null
    grade?: string | null
    kcal?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
  }>(),
  {
    name: 'Food',
    aisle: 'Food',
    illustration: null,
    grade: null,
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  }
)

const takumiImageSrc = (src: string | null | undefined) => {
  if (!src) return ''
  const hashIndex = src.indexOf('#')
  const path = hashIndex === -1 ? src : src.slice(0, hashIndex)
  const hash = hashIndex === -1 ? '' : src.slice(hashIndex + 1)
  const separator = path.includes('?') ? '&' : '?'
  const next = path.toLowerCase().endsWith('.webp') ? `${path}${separator}og=takumi` : path
  return hash ? `${next}#${hash}` : next
}

const round = (v: number) => Math.round(v * 10) / 10

const macros = computed(() => [
  { label: 'Calories', value: Math.round(props.kcal ?? 0), unit: '', color: '#1a1208' },
  { label: 'Protein', value: round(props.protein ?? 0), unit: 'g', color: '#e11d48' },
  { label: 'Carbs', value: round(props.carbs ?? 0), unit: 'g', color: '#2563eb' },
  { label: 'Fat', value: round(props.fat ?? 0), unit: 'g', color: '#d97706' },
  { label: 'Fiber', value: round(props.fiber ?? 0), unit: 'g', color: '#16a34a' },
])

const gradeStyles: Record<string, { bg: string; fg: string; label: string }> = {
  S: { bg: '#dbeafe', fg: '#1e40af', label: 'Exceptional' },
  A: { bg: '#a7f3d0', fg: '#065f46', label: 'Very Healthy' },
  B: { bg: '#d1fae5', fg: '#166534', label: 'Healthy' },
  C: { bg: '#fef3c7', fg: '#854d0e', label: 'Moderate' },
  D: { bg: '#fed7aa', fg: '#7c2d12', label: 'Below Average' },
  E: { bg: '#fecaca', fg: '#7f1d1d', label: 'Low' },
  F: { bg: '#fca5a5', fg: '#450a0a', label: 'Very Low' },
}
const gradeKey = computed(() => (props.grade ?? 'C').charAt(0).toUpperCase())
const gradeBg = computed(() => gradeStyles[gradeKey.value]?.bg ?? '#fef3c7')
const gradeFg = computed(() => gradeStyles[gradeKey.value]?.fg ?? '#854d0e')
const gradeLabel = computed(() => gradeStyles[gradeKey.value]?.label ?? 'Rated')
</script>
