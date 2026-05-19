<template>
  <section class="ai-profile">
    <header class="ai-head">
      <div>
        <p class="ai-eyebrow">AI Insight</p>
        <h2 class="ai-title">컬렉션 성향 분석</h2>
      </div>
      <button
        class="btn-secondary"
        :disabled="loading"
        @click="handleGenerate"
      >
        {{ loading ? '분석 중…' : profile ? '재분석' : '분석하기' }}
      </button>
    </header>

    <div v-if="profile" class="ai-body">
      <span class="ai-theme tag">{{ profile.themeType }}</span>
      <p class="ai-summary">{{ profile.summary }}</p>

      <div v-if="recommendations.length" class="ai-recos">
        <p class="ai-recos-label">
          추천 장소
          <span class="ai-recos-hint">— 클릭하면 위시리스트에 추가돼요</span>
        </p>
        <div class="chip-group">
          <button
            v-for="r in recommendations"
            :key="r"
            type="button"
            class="tag tag-rec"
            :class="{ 'is-wished': isWished(r) || isClicked(r), 'is-collected': isCollected(r) }"
            :disabled="addingName === r || isConsumed(r)"
            :title="chipTitle(r)"
            @click="handleAdd(r)"
          >
            <span class="rec-text">◎ {{ r }}</span>
            <span class="rec-state" aria-hidden="true">{{ stateIcon(r) }}</span>
          </button>
        </div>
        <p v-if="errorMsg" class="ai-recos-error" role="alert">{{ errorMsg }}</p>
      </div>
    </div>

    <p v-else class="ai-empty">
      장소가 3개 이상 쌓이면 AI가 이 컬렉션의 성향을 분석하고 비슷한 결의 장소를 추천해드려요.
    </p>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { generateProfile, addToWishlist, getWishlist } from '../api/index.js'

const props = defineProps({
  collectionId: Number,
  initialProfile: Object,
  // 부모 (CollectionDetail) 가 들고 있는 places 배열 — 추천 칩과 이름 매칭해 "이미 추가됨" 판단
  collectionPlaces: { type: Array, default: () => [] },
})
const profile = ref(props.initialProfile || null)
const loading = ref(false)

// 추가 중인 chip 이름 / 이미 위시 추가된 이름들 / 에러 메시지
const addingName = ref(null)
const wishedNames = ref(new Set())
// "한 번 클릭한 칩은 sticky" — 사용자가 칩을 위시에 담은 적이 있으면,
// 이후 위시 삭제 / promote / 컬렉션 추가 어느 경로를 거치든 *재분석 전까진* 계속 disabled.
// 이름 매칭 (AI 출력 vs Google Places displayName) 이 본질적으로 불안정해서,
// 칩 자체의 인터랙션 히스토리를 신호로 쓰는 게 가장 견고함.
const clickedNames = ref(new Set())
const errorMsg = ref('')

const recommendations = computed(() => {
  if (!profile.value?.recommendations) return []
  try { return JSON.parse(profile.value.recommendations) } catch { return [] }
})

// 이름 정규화 — AI 추천은 "장소명 (도시, 나라)" 형식이지만 Google Places 가 채운
// place.name 은 괄호 없는 깔끔한 displayName 이라, 비교 시점엔 양쪽 모두 괄호를 떼고 매칭.
// (Wishlist.vue 의 displayName 과 동일 규칙)
// 단, 언어 / 지점명 차이 같은 깊은 불일치는 여기서 못 잡음 →
// "한 번 클릭한 칩은 sticky" 규칙(clickedNames) 이 본질적인 안전장치.
function normalizeName(s) {
  return (s || '').replace(/\s*\([^)]*\)\s*$/, '').trim() || s
}

// 이미 컬렉션에 추가된 장소 이름 Set — props.collectionPlaces 가 reactive 라
// 장소 추가 / promote / 삭제에 따라 자동 갱신됨
const collectedNames = computed(
  () => new Set(props.collectionPlaces.map((p) => normalizeName(p.name))),
)

// 칩 상태 판정 — 세 신호 합집합으로 disabled
//   ① isClicked   — 이전에 칩을 클릭해 위시에 담은 적 있음 (sticky, localStorage 영속)
//   ② isWished    — 현재 위시리스트에 같은 이름이 있음 (다른 경로 추가 포함)
//   ③ isCollected — 이미 이 컬렉션에 같은 이름의 장소가 있음
function isClicked(name) { return clickedNames.value.has(name) }
function isWished(name) { return wishedNames.value.has(name) }
function isCollected(name) { return collectedNames.value.has(normalizeName(name)) }
function isConsumed(name) { return isClicked(name) || isWished(name) || isCollected(name) }

// ── localStorage 영속화 ──────────────────────────
// per-collection 키 — 다른 컬렉션의 추천엔 영향 없음. 재분석 시 clear.
const clickedLsKey = computed(() => `loci.clicked.${props.collectionId}`)

function loadClicked() {
  try {
    const raw = localStorage.getItem(clickedLsKey.value)
    if (raw) clickedNames.value = new Set(JSON.parse(raw))
  } catch { /* malformed JSON 등 — 무시 */ }
}
function saveClicked() {
  try {
    localStorage.setItem(clickedLsKey.value, JSON.stringify([...clickedNames.value]))
  } catch { /* quota 초과 등 — 무시 */ }
}
function clearClicked() {
  clickedNames.value = new Set()
  try { localStorage.removeItem(clickedLsKey.value) } catch { /* noop */ }
}

async function refetchWishlist() {
  try {
    const { data } = await getWishlist()
    wishedNames.value = new Set(data.items.map((it) => it.name))
  } catch {
    // 비로그인 등은 무시 (이 컴포넌트는 인증된 페이지에서만 쓰임)
  }
}

// sticky 재평가 — 어떤 백엔드 상태(위시 / 컬렉션) 로도 backed up 되지 않으면 해제.
// ⚠️ 의도적으로 "장소 삭제 후" 에만 호출. mount 시점엔 호출하지 않음.
//    이유: promote 직후 새로고침 시점엔 wishedNames 가 비어있고 isCollected 가
//    name mismatch 로 false 일 수 있음 → mount 에서 reconcile 하면 sticky 가 풀려
//    원래의 재추가 버그가 되살아남. "장소를 직접 삭제했다" 라는 명시적 사용자 행동을
//    트리거로 잡으면, 사용자가 진짜 정리한 상황만 안전하게 풀린다.
function reconcileClicked() {
  const before = clickedNames.value.size
  for (const name of [...clickedNames.value]) {
    if (!isWished(name) && !isCollected(name)) {
      clickedNames.value.delete(name)
    }
  }
  if (clickedNames.value.size !== before) saveClicked()
}

// 페이지 진입 시: sticky 기록 복원 + 위시 한 번 로드 (reconcile 은 안 함)
onMounted(async () => {
  loadClicked()
  await refetchWishlist()
})

// 컬렉션 places 변화에 반응:
//   ① 늘었음 — 위시 promote 가능성 → wishedNames 동기화 (이름 표시 일관성 유지)
//   ② 줄었음 — 사용자가 명시적으로 정리한 상황 → wishedNames 동기화 + sticky 재평가
watch(
  () => props.collectionPlaces.length,
  async (newLen, oldLen) => {
    if (newLen === oldLen) return
    await refetchWishlist()
    if (newLen < oldLen) reconcileClicked()
  },
)

function stateIcon(name) {
  if (isCollected(name)) return '◉'
  if (isWished(name) || isClicked(name)) return '✓'
  if (addingName.value === name) return '…'
  return '+'
}

function chipTitle(name) {
  if (isCollected(name)) return '이미 이 컬렉션에 있어요'
  if (isWished(name)) return '위시리스트에 있어요'
  if (isClicked(name)) return '이미 다룬 추천이에요'
  return `${name} 위시리스트에 추가`
}

async function handleAdd(name) {
  if (isConsumed(name) || addingName.value) return
  errorMsg.value = ''
  addingName.value = name
  try {
    // "장소명 (도시, 나라)" 형식이면 city / country parse
    const match = name.match(/^(.+?)\s*\((.+?),\s*(.+?)\)\s*$/)
    const payload = {
      name,
      city: match ? match[2].trim() : null,
      country: match ? match[3].trim() : null,
      sourceCollectionId: props.collectionId,
    }
    await addToWishlist(payload)
    wishedNames.value.add(name)
    clickedNames.value.add(name)
    saveClicked()
  } catch (err) {
    if (err.response?.status === 409) {
      // 이미 있음 — 다른 브라우저 등에서 추가된 경우, 표시만 갱신 (sticky 도 같이 마킹)
      wishedNames.value.add(name)
      clickedNames.value.add(name)
      saveClicked()
    } else {
      errorMsg.value = err.response?.data?.error || '추가 중 오류가 발생했어요'
    }
  } finally {
    addingName.value = null
  }
}

async function handleGenerate() {
  loading.value = true
  try {
    const res = await generateProfile(props.collectionId)
    profile.value = res.data
    // 새 추천 셋 — 이전 sticky 기록은 더 이상 의미 없음 (새 칩들은 처음부터 시작)
    clearClicked()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-profile {
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: 1.75rem 1.75rem 1.5rem;
}
.ai-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.ai-eyebrow {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 0.4rem;
}
.ai-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
}
.ai-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.ai-theme {
  align-self: flex-start;
  background: var(--ink);
  color: var(--ink-contrast);
  border-color: var(--ink);
}
.ai-summary {
  font-family: var(--font-serif);
  font-size: 14.5px;
  color: var(--text);
  line-height: 1.75;
}
.ai-recos {
  padding-top: 0.5rem;
  border-top: 1px dashed var(--hairline);
}
.ai-recos-label {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--soft);
  margin-bottom: 0.65rem;
}
.ai-recos-hint {
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--faint);
}
.ai-recos-error {
  margin-top: 0.6rem;
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--danger-text);
}

/* 추천 chip — button 으로 변환 */
.tag-rec {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 11.5px;
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: 100px;
  padding: 4px 10px 4px 12px;
  color: var(--muted);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.tag-rec:hover:not(:disabled) {
  border-color: var(--ink);
  color: var(--ink);
  background: var(--surface-hover);
}
.tag-rec:disabled {
  cursor: default;
}
.tag-rec .rec-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--hairline);
  color: var(--soft);
  font-size: 11px;
  line-height: 1;
  transition: background 0.15s, color 0.15s;
}
.tag-rec:hover:not(:disabled) .rec-state {
  background: var(--ink);
  color: var(--ink-contrast);
}
/* 이미 위시에 추가된 chip — 살짝 강조 + 체크 표시 */
.tag-rec.is-wished {
  border-color: var(--success-border);
  color: var(--success-text);
  background: var(--success-bg);
}
.tag-rec.is-wished .rec-state {
  background: var(--success-text);
  color: var(--ink-contrast);
}

/* 이미 이 컬렉션에 추가된 chip — 회색 톤 ("완료" 상태) */
.tag-rec.is-collected {
  border-color: var(--hairline);
  color: var(--faint);
  background: transparent;
  opacity: 0.7;
  text-decoration: line-through;
  text-decoration-color: var(--faint);
}
.tag-rec.is-collected .rec-state {
  background: var(--faint);
  color: var(--ink-contrast);
  font-size: 9px;
}

.ai-empty {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  line-height: 1.7;
}
</style>
