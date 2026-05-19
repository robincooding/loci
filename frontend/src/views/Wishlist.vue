<template>
  <div class="page">
    <header class="wishlist-head">
      <div>
        <p class="page-eyebrow">Wishlist</p>
        <h1 class="page-title">가보고 싶은 곳</h1>
        <p class="page-meta">{{ items.length }}개</p>
      </div>
    </header>

    <div v-if="loading" class="state-block">
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>

    <div v-else-if="items.length === 0" class="state-block">
      <span class="state-icon">◎</span>
      <p class="empty-title">아직 위시리스트가 비어있어요</p>
      <p class="empty-sub">컬렉션의 AI 추천에서 마음에 드는 장소를 담아보세요.</p>
    </div>

    <ul v-else class="wishlist">
      <li v-for="it in items" :key="it.id" class="wish-item">
        <div class="wish-main">
          <p class="wish-name">{{ displayName(it) }}</p>
          <p v-if="it.city || it.country" class="wish-loc">
            <span class="wish-loc-dot">◎</span>
            {{ [it.city, it.country].filter(Boolean).join(', ') }}
          </p>
          <p class="wish-meta">담은 날: {{ formatDate(it.createdAt) }}</p>
        </div>
        <div class="wish-actions">
          <button
            class="wish-visited"
            :disabled="removing === it.id"
            @click="handleVisited(it)"
          >
            다녀왔어요
          </button>
          <button
            class="wish-remove"
            aria-label="제거"
            :disabled="removing === it.id"
            @click="handleRemove(it)"
          >
            {{ removing === it.id ? '…' : '✕' }}
          </button>
        </div>
      </li>
    </ul>

    <CollectionPicker
      v-if="pickerItem"
      :place-name="displayName(pickerItem)"
      @select="handlePickCollection"
      @create-new="handleCreateNewCollection"
      @close="pickerItem = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getWishlist, removeFromWishlist } from '../api/index.js'
import CollectionPicker from '../components/CollectionPicker.vue'

const router = useRouter()
const items = ref([])
const loading = ref(true)
const removing = ref(null)

// "다녀왔어요" 흐름: 클릭한 위시 항목을 임시로 보관 → CollectionPicker 모달에서 컬렉션 선택 →
// /collections/:id?prefillName=...&wishId=... 로 이동해 CollectionDetail 이 자동으로 폼을 열고
// 추가 성공 후 위시 항목을 자동 삭제한다 (WP-2 에서 구현).
const pickerItem = ref(null)

onMounted(async () => {
  try {
    const { data } = await getWishlist()
    items.value = data.items
  } finally {
    loading.value = false
  }
})

// "Blue Bottle (도쿄, 일본)" → city/country 가 별도 컬럼이라 이름만 깔끔히
function displayName(it) {
  if (!it.city && !it.country) return it.name
  // name 에 "(...)" 가 있으면 제거 (cleaner UI, 위치는 별도 줄에 표시)
  return it.name.replace(/\s*\([^)]*\)\s*$/, '').trim() || it.name
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

async function handleRemove(it) {
  if (!confirm(`"${displayName(it)}" 를 위시리스트에서 제거할까요?`)) return
  removing.value = it.id
  try {
    await removeFromWishlist(it.id)
    items.value = items.value.filter((x) => x.id !== it.id)
  } finally {
    removing.value = null
  }
}

function handleVisited(it) {
  pickerItem.value = it
}

function handlePickCollection(collectionId) {
  // CollectionDetail 이 query 로 prefillName/wishId 를 받아 자동으로 폼을 열고
  // 추가 성공 시 wishId 항목을 삭제한다.
  router.push({
    path: `/collections/${collectionId}`,
    query: { prefillName: displayName(pickerItem.value), wishId: pickerItem.value.id },
  })
  pickerItem.value = null
}

function handleCreateNewCollection() {
  // 새 컬렉션 만들기 — 컬렉션 생성 후엔 CollectionList 로 돌아가야 직관적이라
  //   ① 위시 항목 정보는 일단 잃는다 (CollectionForm 에서 곧장 detail 로 이동하지 않음)
  //   ② 사용자가 새 컬렉션을 만들고 다시 위시로 돌아와 "다녀왔어요" 를 누르는 흐름
  // 향후 CollectionForm 까지 query 를 전달해 흐름을 이어주는 개선 여지 있음.
  router.push('/collections/new')
  pickerItem.value = null
}
</script>

<style scoped>
.wishlist-head {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--hairline);
}
.page-meta {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
  margin-top: 0.5rem;
}

.wishlist {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.wish-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  transition: border-color 0.15s;
}
.wish-item:hover {
  border-color: var(--hairline-strong);
}
.wish-main {
  flex: 1;
  min-width: 0;
}
.wish-name {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 0.35rem;
}
.wish-loc {
  font-family: var(--font-sans);
  font-size: 12.5px;
  color: var(--soft);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 0.3rem;
}
.wish-loc-dot {
  font-size: 9px;
  color: var(--faint);
}
.wish-meta {
  font-family: var(--font-sans);
  font-size: 11.5px;
  color: var(--faint);
}

.wish-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.wish-visited {
  font-family: var(--font-sans);
  font-size: 12px;
  background: var(--ink);
  color: var(--ink-contrast);
  border: 1px solid var(--ink);
  border-radius: 100px;
  padding: 6px 14px;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: opacity 0.15s, background 0.15s;
}
.wish-visited:hover:not(:disabled) {
  opacity: 0.85;
}
.wish-visited:disabled { opacity: 0.4; cursor: default; }

.wish-remove {
  background: none;
  border: 1px solid var(--hairline);
  border-radius: 100px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--soft);
  font-size: 12px;
  line-height: 1;
  transition: color 0.15s, border-color 0.15s;
}
.wish-remove:hover:not(:disabled) {
  color: #e57373;
  border-color: #e57373;
}
.wish-remove:disabled { opacity: 0.4; cursor: default; }

.empty-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--muted);
  margin-top: 0.5rem;
}
.empty-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--soft);
}
</style>
