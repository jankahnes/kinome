<template>
  <div :style="{
    width: '1200px',
    height: '630px',
    display: 'flex',
    background: 'linear-gradient(135deg, #fdf8f5 0%, #f6e9e1 100%)',
    fontFamily: 'Inter, sans-serif',
    color: '#1e293b',
    position: 'relative',
  }">
    <!-- Left text column -->
    <div :style="{
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      padding: '56px 56px 56px 56px',
      justifyContent: 'space-between',
    }">
      <div style="display: flex; flex-direction: column;">
        <div :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '16px',
          letterSpacing: '0.12em',
          color: '#CF6139',
          textTransform: 'uppercase',
          fontWeight: 400,
        }">
          <div :style="{ width: '28px', height: '2px', background: '#CF6139' }" />
          <span :style="{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '16px',
            letterSpacing: '0.12em',
            color: '#CF6139',
            textTransform: 'uppercase',
            fontWeight: 400,
          }">
            Kinome | Recipe
          </span>
        </div>

        <h1 :style="{
          fontFamily: 'Fraunces, serif',
          fontSize: title.length > 40 ? '64px' : '82px',
          lineHeight: '0.98',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#1a1208',
          marginTop: '28px',
          marginBottom: '0',
          overflow: 'hidden',
          maxHeight: title.length > 40 ? '188px' : '241px',
        }">
          {{ title }}
        </h1>

        <p v-if="description" :style="{
          fontSize: '22px',
          lineHeight: '1.35',
          color: '#475569',
          marginTop: '20px',
          overflow: 'hidden',
          maxHeight: '60px',
        }">
          {{ description }}
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div v-for="pill in pills" :key="pill" :style="{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(207, 97, 57, 0.10)',
            color: '#8b3a1f',
            padding: '7px 16px',
            borderRadius: '999px',
            fontSize: '17px',
            fontWeight: 600,
          }">
            {{ pill }}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          <div :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Fraunces, serif',
            fontWeight: 600,
            fontSize: '38px',
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: gradeBg,
            color: gradeFg,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }" v-if="grade">
            {{ grade }}
          </div>
          <div v-if="grade" style="display: flex; flex-direction: column;">
            <div :style="{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#94a3b8',
            }">
              Health Grade
            </div>
            <div style="font-size: 22px; font-weight: 600; color: #334155; margin-top: 2px;">
              {{ gradeLabel }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right image column -->
    <div :style="{
      width: '500px',
      padding: '20px 0px 56px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }">
      <div :style="{
        width: '440px',
        height: '440px',
        borderRadius: '32px',
        overflow: 'hidden',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }">
        <img v-if="picture" :src="takumiImageSrc(picture)" :style="{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(10px 20px 20px rgba(0, 0, 0, 0.15))',
        }" />
        <div v-else :style="{
          fontFamily: 'Fraunces, serif',
          fontSize: '140px',
          color: 'rgba(207, 97, 57, 0.35)',
          fontWeight: 400,
        }">
          {{ title.charAt(0) }}
        </div>
      </div>
    </div>

    <!-- Brand footer -->
    <div :style="{
      position: 'absolute',
      bottom: '44px',
      right: '56px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      color: '#94a3b8',
      letterSpacing: '0.08em',
    }">
      kinome.app
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    picture?: string | null
    grade?: string | null
    pills?: string[]
  }>(),
  {
    title: 'Recipe',
    description: '',
    picture: null,
    grade: null,
    pills: () => [],
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
