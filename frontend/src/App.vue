<template>
  <div class="app-root">
    <!-- 부팅 splash — 라우터 가드의 auth.bootstrap() 이 백엔드를 깨우는 동안 노출 -->
    <!-- Render 무료 티어 cold start (~30-60s) 동안 빈 화면 대신 표시 -->
    <div v-if="!initialized" class="boot-splash">
      <LociLogo class="boot-splash-logo" />
      <div class="loading-dots" aria-label="로딩 중">
        <span></span><span></span><span></span>
      </div>
      <!-- 3초 이상 걸리면 (cold start 가능성 높음) 컨텍스트 안내 -->
      <p v-if="showColdStartHint" class="boot-splash-hint">
        잠시만요 — 서버를 깨우는 중이에요.<br />
        첫 접속에 30초 정도 걸릴 수 있습니다.
        조금만 기다려주세요.
      </p>
    </div>

    <nav v-if="initialized && !hideNav" class="app-nav">
      <div class="app-nav-inner">
        <RouterLink to="/" class="app-nav-logo-link" aria-label="Loci 홈으로">
          <LociLogo class="app-nav-logo" />
        </RouterLink>

        <div class="app-nav-links">
          <template v-if="isAuthenticated">
            <RouterLink to="/collections" class="app-nav-link" active-class="is-active">아카이브</RouterLink>
            <RouterLink to="/wishlist" class="app-nav-link" active-class="is-active">가볼 곳</RouterLink>
            <RouterLink
              to="/account"
              class="app-nav-link app-nav-user"
              :title="user.email"
              active-class="is-active"
            >
              {{ user.displayName || user.email }}
            </RouterLink>
            <button class="app-nav-link app-nav-link-btn" @click="handleLogout">로그아웃</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="app-nav-link" active-class="is-active">로그인</RouterLink>
            <RouterLink to="/register" class="app-nav-link app-nav-link-cta" active-class="is-active">회원가입</RouterLink>
          </template>

          <!-- 테마 토글 — 항상 노출 (인증 여부 무관) -->
          <ThemeToggle />
        </div>
      </div>
    </nav>

    <main v-if="initialized" :class="['app-main', { 'app-main--padded': !hideNav }]">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LociLogo from './components/LociLogo.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { useAuth } from './stores/auth'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, logout, initialized } = useAuth()

// 부팅이 3초 넘게 걸리면 cold start 가능성 → 사용자에게 컨텍스트 안내
// 무료 티어로 운영 중이라는 사실을 드러내며 기다림이 의도된 것임을 알림
const showColdStartHint = ref(false)
onMounted(() => {
  setTimeout(() => {
    if (!initialized.value) showColdStartHint.value = true
  }, 3000)
})

// Landing / 인증 페이지 자체에 nav 가 있거나 디자인상 글로벌 nav 가 겹쳐서 안 보여야 하는 경로
const hideNav = computed(() =>
  ['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(route.path),
)

async function handleLogout() {
  await logout()
  router.replace('/login')
}
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-serif);
}

/* ── 부팅 splash ──────────────────────────────────────────
   라우터 가드의 auth.bootstrap() 이 백엔드를 깨우는 동안 노출.
   첫 페인트 직후 즉시 보이도록 inline 스타일과 동일한 변수 사용 →
   FOUC 방지 inline script 가 미리 적용한 테마 변수 그대로 따라감. */
.boot-splash {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  background: var(--bg);
  z-index: 100;
  animation: bootSplashIn 0.3s ease;
}
@keyframes bootSplashIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.boot-splash-logo {
  height: 36px;
  color: var(--ink);
}
.boot-splash-hint {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  text-align: center;
  line-height: 1.7;
  max-width: 28ch;
  margin-top: 0.5rem;
  animation: bootSplashIn 0.4s ease;
}

.app-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--hairline);
}
.app-nav-inner {
  max-width: 920px;
  margin: 0 auto;
  padding: 0.65rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.app-nav-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: var(--ink);
  transition: opacity 0.2s;
}
.app-nav-logo-link:hover { opacity: 0.7; }
.app-nav-logo {
  display: inline-block;
  height: 28px;
}
.app-nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.app-nav-link {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--soft);
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: color 0.2s;
}
.app-nav-link:hover { color: var(--ink); }
.app-nav-link.is-active { color: var(--ink); }

/* 사용자 표시 이름 — 디스플레이만 */
.app-nav-user {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  padding-left: 0.5rem;
  border-left: 1px solid var(--hairline);
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* button 요소를 a 처럼 보이도록 reset */
.app-nav-link-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

/* 회원가입 CTA — 살짝 강조 */
.app-nav-link-cta {
  padding: 6px 14px;
  border: 1px solid var(--hairline-strong);
  border-radius: 100px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.app-nav-link-cta:hover {
  color: var(--ink);
  border-color: var(--ink);
}

.app-main {
  width: 100%;
}
.app-main--padded {
  padding-top: 0.5rem;
}
</style>
