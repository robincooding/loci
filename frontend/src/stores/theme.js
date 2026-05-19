// ── 테마 store ──────────────────────────────────────────
// light / dark 두 가지 테마. 사용자의 명시적 선택을 localStorage 에 저장.
//
// 디자인 결정:
//   ① 시스템 prefers-color-scheme 은 따라가지 않음 — 기본은 무조건 light.
//      사용자가 의식적으로 토글해야 dark 로 전환되고, 그 선택만 영속화.
//   ② FOUC (Flash of Unstyled Content) 방지는 index.html 의 inline script 가 담당.
//      여기 코드는 Vue 가 부팅된 후 실행돼서, 이때 dark 를 적용하면 깜빡임 발생함.
//      → inline script 가 첫 페인트 전에 <html data-theme="dark"> 를 이미 세팅함.
//      이 모듈의 초기 상태는 그걸 읽어와 동기화.
//   ③ ref 를 module-level 로 둠 (factory 함수가 아니라) — 어디서 import 해도 같은
//      인스턴스를 공유. 단순한 글로벌 상태에 Pinia 같은 라이브러리는 과함.

import { ref, watch } from 'vue'

const LS_KEY = 'loci.theme'

// 초기값 — inline script 가 이미 <html> 에 적용한 상태를 읽어옴 (SSR 안전하진 않지만 우리는 SPA)
const initial = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
const theme = ref(initial)

// 변경 시 DOM + localStorage 동기화
//   - data-theme="dark" 면 dark 변수가 적용됨, 없으면 :root 의 light 가 그대로
//   - localStorage 는 다음 방문 / 새로고침 시 inline script 가 읽어 즉시 적용
watch(theme, (v) => {
  if (v === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  try {
    localStorage.setItem(LS_KEY, v)
  } catch {
    /* quota 초과 / 사파리 private mode 등 — 무시 */
  }
})

export function useTheme() {
  return {
    theme, // read-only 처럼 다루지만 export 단순화를 위해 ref 그대로
    toggle: () => { theme.value = theme.value === 'dark' ? 'light' : 'dark' },
    isDark: () => theme.value === 'dark',
  }
}
