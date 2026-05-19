<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div
        class="picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        <button class="modal-close" aria-label="닫기" @click="$emit('close')">✕</button>

        <div class="picker-body">
          <p class="picker-eyebrow">다녀온 장소를 추가할</p>
          <h2 id="picker-title" class="picker-title">컬렉션 선택</h2>
          <p v-if="placeName" class="picker-subtitle">
            <span class="picker-loc-dot">◎</span> {{ placeName }}
          </p>

          <div class="picker-list-wrap">
            <div v-if="loading" class="picker-state">
              <div class="loading-dots"><span></span><span></span><span></span></div>
            </div>
            <div v-else-if="!collections.length" class="picker-state">
              <p class="picker-state-text">아직 컬렉션이 없어요.</p>
              <button class="btn-primary" @click="handleCreateNew">+ 새 컬렉션 만들기</button>
            </div>
            <ul v-else class="picker-list">
              <li
                v-for="c in collections"
                :key="c.id"
                class="picker-item"
                @click="$emit('select', c.id)"
              >
                <div class="picker-item-main">
                  <span class="tag picker-item-tag">{{ c.theme }}</span>
                  <p class="picker-item-title">{{ c.title }}</p>
                </div>
                <span class="picker-item-arrow">→</span>
              </li>
            </ul>
          </div>

          <div v-if="collections.length" class="picker-actions">
            <button class="btn-secondary" @click="handleCreateNew">+ 새 컬렉션 만들기</button>
            <button class="picker-cancel" @click="$emit('close')">취소</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getCollections } from '../api/index.js'

// placeName 은 표시용 (어떤 장소를 어느 컬렉션에 넣을지 사용자에게 보여주는 헤더)
defineProps({ placeName: { type: String, default: '' } })
const emit = defineEmits(['select', 'create-new', 'close'])

const collections = ref([])
const loading = ref(true)

// 첫 페이지 (limit 기본값) 만 로드 — 모달은 가벼운 선택 UI 이므로 무한스크롤은 생략.
// 컬렉션이 많아 페이지를 넘는 경우엔 "새로 만들기" 또는 일반 아카이브 페이지에서 처리하면 됨.
onMounted(async () => {
  try {
    const res = await getCollections()
    collections.value = res.data.items || []
  } catch (e) {
    console.error('[CollectionPicker] failed to load collections', e)
  } finally {
    loading.value = false
  }
})

function handleCreateNew() {
  emit('create-new')
}

// ESC 닫기 + body 스크롤 잠금 (PlaceModal 과 동일 패턴)
function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(20, 20, 20, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  animation: modalFadeIn 0.2s ease;
}
@keyframes modalFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.picker-dialog {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow-modal);
  animation: modalSlideUp 0.25s ease;
}
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay-light);
  border: 1px solid var(--hairline);
  border-radius: 100px;
  font-size: 13px;
  color: var(--soft);
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.modal-close:hover {
  color: var(--ink);
  border-color: var(--hairline-strong);
  background: var(--card);
}

.picker-body {
  padding: 2rem 1.75rem 1.5rem;
}

.picker-eyebrow {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 0.45rem;
}

.picker-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.005em;
  line-height: 1.3;
  margin-bottom: 0.55rem;
}

.picker-subtitle {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 1.5rem;
}
.picker-loc-dot {
  font-size: 9px;
  color: var(--faint);
}

.picker-list-wrap {
  margin: 1rem 0 1.25rem;
}

.picker-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--hairline);
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 0.5rem;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  transition: background 0.15s;
}
.picker-item:hover {
  background: var(--surface-hover);
}
.picker-item-main {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}
.picker-item-tag {
  align-self: flex-start;
}
.picker-item-title {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--ink);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.picker-item-arrow {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--faint);
  flex-shrink: 0;
}

.picker-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}
.picker-state-text {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
}

.picker-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid var(--hairline);
}
.picker-cancel {
  font-family: var(--font-sans);
  font-size: 13px;
  background: none;
  border: none;
  color: var(--soft);
  cursor: pointer;
  padding: 8px 12px;
  letter-spacing: 0.02em;
  transition: color 0.15s;
}
.picker-cancel:hover { color: var(--ink); }

/* .loading-dots 는 main.css 의 전역 클래스 사용 */
</style>
