<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #fdf8f5 0%, #f4d9d0 100%)',
      fontFamily: 'Inter, sans-serif',
      color: '#1a1208',
      padding: '80px',
      position: 'relative',
    }"
  >
    <div
      :style="{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '18px',
        letterSpacing: '0.18em',
        color: '#CF6139',
        textTransform: 'uppercase',
        fontWeight: 400,
        marginBottom: '28px',
      }"
    >
      {{ eyebrow }}
    </div>
    <h1
      :style="{
        fontFamily: 'Fraunces, serif',
        fontSize: '108px',
        lineHeight: '0.95',
        fontWeight: 400,
        letterSpacing: '-0.03em',
        textAlign: 'center',
        margin: 0,
        maxWidth: '1000px',
      }"
    >
      {{ title }}
    </h1>
    <p
      v-if="subtitle"
      :style="{
        fontSize: '28px',
        lineHeight: '1.35',
        color: '#475569',
        textAlign: 'center',
        marginTop: '28px',
        maxWidth: '820px',
      }"
    >
      {{ subtitle }}
    </p>

    <div
      :style="{
        position: 'absolute',
        bottom: '44px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '16px',
        color: '#94a3b8',
        letterSpacing: '0.12em',
      }"
    >
      <div :style="{ width: '18px', height: '2px', background: '#CF6139' }" />
      kinome.app
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    eyebrow?: string
  }>(),
  {
    title: 'Kinome',
    subtitle: 'Discover recipes and foods worth eating.',
    eyebrow: 'Kinome',
  }
)
</script>
