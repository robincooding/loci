<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
    :title="theme === 'dark' ? '라이트 모드' : '다크 모드'"
    @click="toggle"
  >
    <!-- dark 일 때는 해 아이콘 (라이트로 전환 가능함을 암시) -->
    <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
        <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
        <line x1="5.2" y1="18.8" x2="6.9" y2="17.1" />
        <line x1="17.1" y1="6.9" x2="18.8" y2="5.2" />
      </g>
    </svg>
    <!-- light 일 때는 달 아이콘 -->
    <svg v-else viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
        fill="currentColor"
      />
    </svg>
  </button>
</template>

<script setup>
import { useTheme } from '../stores/theme'

const { theme, toggle } = useTheme()
</script>

<style scoped>
.theme-toggle {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.2s;
}
.theme-toggle:hover {
  color: var(--ink);
  transform: scale(1.1);
}
</style>
