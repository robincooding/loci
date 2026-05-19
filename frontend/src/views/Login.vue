<template>
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="auth-logo-link" aria-label="Loci 홈으로">
        <LociLogo class="auth-logo" />
      </RouterLink>

      <h1 class="auth-title">다시 만나서 반가워요</h1>
      <p class="auth-sub">아카이브를 이어가 봅시다.</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div>
          <label class="form-label" for="login-email">이메일</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="you@example.com"
            autocomplete="email"
            required
            :disabled="loading"
          />
        </div>

        <div>
          <label class="form-label" for="login-password">비밀번호</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            class="form-input"
            autocomplete="current-password"
            required
            :disabled="loading"
          />
        </div>

        <p v-if="errorMessage" class="auth-error" role="alert">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="btn-primary auth-submit"
          :disabled="loading || !canSubmit"
        >
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>

        <p class="auth-forgot">
          <RouterLink to="/forgot-password" class="auth-forgot-link">비밀번호를 잊으셨나요?</RouterLink>
        </p>
      </form>

      <p class="auth-footer">
        아직 계정이 없으신가요?
        <RouterLink to="/register" class="auth-link">회원가입</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import LociLogo from '../components/LociLogo.vue'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => email.value && password.value)

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    // 원래 가려던 페이지로 복귀 (라우트 가드가 ?redirect= 쿼리에 저장해두는 패턴)
    const next = typeof route.query.redirect === 'string' ? route.query.redirect : '/collections'
    router.replace(next)
  } catch (err) {
    errorMessage.value =
      err.response?.data?.error || '로그인 중 오류가 발생했어요'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.25rem;
  background: var(--bg);
}

/* .auth-card 는 main.css 의 전역 클래스 사용 — 정의 중복 제거됨 */

.auth-logo-link {
  display: flex;
  justify-content: center;
  color: var(--ink);
  text-decoration: none;
  margin-bottom: 1.75rem;
  transition: opacity 0.2s;
}
.auth-logo-link:hover { opacity: 0.7; }
.auth-logo { height: 32px; }

.auth-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--ink);
  text-align: center;
  letter-spacing: -0.005em;
  margin-bottom: 0.4rem;
}
.auth-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  text-align: center;
  margin-bottom: 2rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-error {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--danger-text);
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  line-height: 1.5;
}

.auth-submit {
  width: 100%;
  padding: 13px 28px;
  font-size: 14px;
  margin-top: 0.25rem;
}

.auth-forgot {
  text-align: center;
  margin-top: 0.25rem;
}
.auth-forgot-link {
  font-family: var(--font-sans);
  font-size: 12.5px;
  color: var(--soft);
  text-decoration: none;
  transition: color 0.15s;
}
.auth-forgot-link:hover { color: var(--ink); }

.auth-footer {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  text-align: center;
  margin-top: 1.75rem;
}
.auth-link {
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid var(--hairline-strong);
  padding-bottom: 1px;
  margin-left: 4px;
  transition: border-color 0.15s;
}
.auth-link:hover { border-color: var(--ink); }
</style>
