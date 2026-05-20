# Loci

> 좋았던 장소를 테마별로 큐레이션하고, 그 순간의 감정과 맥락을 함께 기록하는 장소 아카이브.

라틴어 *locus*(장소)의 복수형. `[ˈloʊ.saɪ]` (로사이).

**Live Demo** — https://loci-steel.vercel.app

```
이메일:   demo@loci.dev
비밀번호: loci-demo-2026
```

> Render 무료 티어로 호스팅되어 15분 무요청 시 sleep 됩니다.
> 첫 접속에 ~30초 cold start 가 있을 수 있어요.

---

## Loci 는

좋아하는 카페, 인상 깊었던 전시, 다시 가고 싶은 골목 — 일상에서 마주친 의미 있는 장소들을 그저 위치로만 남기는 것이 아쉬웠습니다. **왜 좋았는지, 그 순간 어떤 감정이었는지** 까지 함께 묶어두면 시간이 지나도 그 자리에 다녀온 자신이 떠오르도록 — 그런 기록을 위한 도구입니다.

카페 컬렉션, 미술관 컬렉션처럼 *나의 취향* 으로 묶은 테마 아카이브 안에 장소와 그 순간을 함께 담습니다.

## 주요 기능

- **테마 컬렉션** — 카페 / 전시 / 미식 / 골목 산책 등 자유 주제의 컬렉션 단위로 장소를 묶음
- **장소 큐레이션** — 큐레이터 메모 · 가장 기억에 남는 것 · 그 순간의 감정 · 대표 사진을 함께 기록
- **Google Places 자동완성** — 검색만으로 좌표 · 주소 · 카테고리 자동 채움
- **지도 시각화** — 컬렉션 안 장소들을 Google Maps 위에 카테고리별 마커로 표시
- **AI 컬렉션 분석** — Gemini 가 컬렉션의 성향 유형 · 한 줄 요약 · 비슷한 결의 추천 장소를 생성
- **가볼 곳 위시리스트** — AI 추천을 한 번에 위시에 담고, "다녀왔어요" 한 번으로 컬렉션 장소로 승격
- **라이트 / 다크 모드**
- **개인 계정 격리** — 모든 데이터는 사용자별로 완전히 분리

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Vue 3 · Vue Router · Vite · Tailwind CSS v4 |
| Backend | Node.js · Express 5 · Prisma 7 · Zod |
| Auth | bcrypt · JWT (httpOnly cookie) |
| Database | PostgreSQL (Neon serverless) |
| Storage | AWS S3 (presigned PUT) |
| External APIs | Google Maps / Places · Gemini 2.5 Flash |
| Test / CI | Vitest · Supertest · Playwright · GitHub Actions |
| Hosting | Vercel (frontend) · Render (backend) · Neon (database) |

## 아키텍처

```
Browser
  │
  ├─→ Vercel (정적 SPA)
  │      │
  │      │  cookie 포함 cross-origin XHR
  │      ▼
  │   Render (Express + Prisma)
  │      ├─→ Neon PostgreSQL
  │      ├─→ AWS S3 (presigned URL)
  │      └─→ Google Gemini
  │
  └─→ Google Maps API (브라우저 직접 호출, referrer 제한)
```

### 데이터 모델

```
User ─< Collection ─┬─< Place
                    └── CollectionProfile  (AI 분석 결과)

User ─< WishlistItem (가볼 곳)
```

모든 도메인 객체는 User 에 귀속되어 격리됩니다. Place / Profile 은 Collection 삭제 시 cascade.

### 구현 메모

설계할 때 의식적으로 가져간 몇 가지 결정:

- **소유권 위반은 403 이 아닌 404 로 응답** — 다른 사용자 리소스의 존재 여부 자체를 노출하지 않습니다. IDOR + enumeration 방어.
- **이미지 업로드는 백엔드를 거치지 않음** — S3 presigned PUT URL 만 발급하고 브라우저가 S3 에 직접 업로드. 백엔드 메모리·대역폭 부담 0, AWS 자격증명도 노출되지 않음.
- **AI 호출에 일일 사용량 제한 + 24h 캐시** — 같은 컬렉션의 반복 분석을 차단해 토큰 비용 통제.
- **AI 추천 칩의 sticky 상태** — 사용자가 한 번 클릭해 위시에 담은 추천은 *재분석 전까지* 비활성. LLM 출력명과 Google Places 정식명이 다를 수 있는 환경에서도 견고하게 동작.
- **커서 기반 페이지네이션** — offset 방식의 데이터 변경 중 중복·누락 문제 회피.
- **인증** — JWT 를 httpOnly cookie 로 발급, cross-origin 환경에선 `SameSite=None; Secure` 로 전환. XSS 로 토큰 탈취 불가, CSRF 는 sameSite 정책으로 차단.
- **다크 모드 디자인 시스템** — 9개 핵심 + 7개 파생 CSS 변수로 모든 컴포넌트가 단일 토큰 위에서 작동. 새 컴포넌트는 변수만 쓰면 자동으로 양 테마 대응.

---

## 로컬에서 실행

```bash
git clone <repo-url> loci && cd loci

# 환경 변수 — 두 파일 채움 (아래 표 참고)
cp .env.example .env
cp frontend/.env.example frontend/.env

# 백엔드
cd backend
npm install
npx prisma migrate deploy   # DB 스키마 적용
npm run seed                # 데모 사용자 + 시드 데이터 (선택)
npm run dev                 # http://localhost:3000

# 프론트엔드 (다른 터미널)
cd ../frontend
npm install
npm run dev                 # http://localhost:5173
```

**데이터베이스** 는 [Neon](https://neon.tech) 무료 티어 가입 후 `DATABASE_URL` 한 줄을 받아 `.env` 에 넣으면 별도 PostgreSQL 설치 없이 바로 동작합니다.

### 필수 환경 변수

| 위치 | 키 | 설명 |
|---|---|---|
| `.env` | `DATABASE_URL` | PostgreSQL 연결 문자열 (`postgresql://...?sslmode=require`) |
| `.env` | `JWT_SECRET` | `openssl rand -hex 64` 로 생성한 충분히 긴 랜덤값 |
| `.env` | `ALLOWED_ORIGINS` | CORS 화이트리스트 (쉼표 구분) |
| `.env` | `FRONTEND_URL` | 비밀번호 재설정 메일 링크용 |
| `frontend/.env` | `VITE_API_URL` | 백엔드 API base URL |

### 선택 환경 변수 (없으면 해당 기능만 비활성)

| 키 | 활성화되는 기능 |
|---|---|
| `GEMINI_API_KEY` | AI 컬렉션 분석 / 추천 |
| `AWS_ACCESS_KEY_ID` · `AWS_SECRET_ACCESS_KEY` · `AWS_REGION` · `AWS_S3_BUCKET` | 새 사진 업로드 |
| `VITE_GOOGLE_PLACES_API_KEY` | 장소 자동완성 / 지도 |

## 테스트

```bash
# 백엔드 — 단위 + 통합
cd backend && npm test

# E2E
cd frontend && npx playwright test
```

CI 는 GitHub Actions 가 push 시점에 PostgreSQL service 컨테이너를 띄워 백엔드 테스트와 프론트엔드 빌드를 자동으로 수행합니다.

## 디렉터리 구조

```
loci/
├── backend/
│   ├── src/
│   │   ├── lib/                # prisma client · zod validate · auth (bcrypt/jwt/cookie)
│   │   ├── middleware/         # requireAuth · rate limit
│   │   └── routes/             # auth · collections · places · upload · ai · wishlist
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   └── tests/                  # vitest + supertest
└── frontend/
    ├── src/
    │   ├── views/              # Landing · Login · Register · CollectionList · CollectionDetail · Wishlist · ...
    │   ├── components/         # MapView · PlaceCard · PlaceModal · PlaceSearch · AiProfile · ThemeToggle · ...
    │   ├── stores/             # auth · theme (module-scope composables)
    │   ├── api/index.js        # axios (withCredentials + 401 인터셉터)
    │   └── router.js
    └── tests-e2e/              # Playwright
```
