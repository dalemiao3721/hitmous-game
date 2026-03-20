# 打地鼠機率遊戲 - 系統架構設計文件 (System Design)

> 依據 `proposal.md` 與 `docs/mockups/` UI 原型設計，進行完整的系統架構規劃。
>
> 本遊戲作為 `game-lobby` Monorepo 中的 App 模組（`apps/hitmous-game/`），透過大廳統一閘道提供服務。

---

## 目錄

1. [系統總覽](#1-系統總覽)
2. [Monorepo 專案結構](#2-monorepo-專案結構)
3. [前端架構設計](#3-前端架構設計)
4. [後端架構設計](#4-後端架構設計)
5. [API 規格定義](#5-api-規格定義)
6. [資料模型設計](#6-資料模型設計)
7. [核心演算法模組](#7-核心演算法模組)
8. [Provably Fair 機制設計](#8-provably-fair-機制設計)
9. [安全性設計](#9-安全性設計)
10. [測試策略](#10-測試策略)
11. [大廳錢包整合](#11-大廳錢包整合)
12. [部署架構](#12-部署架構)

---

## 1. 系統總覽

### 1.1 設計目標

| 目標 | 說明 |
|------|------|
| **公平透明** | Provably Fair 機制，玩家可自行驗證每局結果 |
| **精確 RTP** | 五段式 RTP (94/96/97/98/99%) 數學保證 |
| **高互動體驗** | 打地鼠主題的敲擊特效與動態倍率跳動 |
| **安全可靠** | 後端權威驗證，防止竄改與重放攻擊 |
| **可維護性** | Monorepo + TypeScript 全端型別安全 |

### 1.2 整合規格

| 項目 | 規範 |
|------|------|
| **前端 Base URL** | `/hitmous-game/`（透過 Port 3001 閘道代理） |
| **行動端 Mobile Route** | `/hitmous-game/m/`（強制載入 Mobile Pro UI） |
| **後端 API** | 透過 Port 3002 閘道代理至 `/hitmous-game/` 路徑 |
| **PWA** | 支援獨立 Manifest 定義與離線支援（`vite-plugin-pwa`） |
| **錢包整合** | 透過大廳 Wallet API Client 進行餘額操作（存/取款、結算） |

### 1.3 技術選型

| 層級 | 技術 | 選型理由 |
|------|------|----------|
| 前端框架 | Vite + React 18 + TypeScript | 極速 HMR、豐富生態系 |
| 樣式方案 | Vanilla CSS + CSS Variables | 對標 Premium Casino Glassmorphism 風格，無框架依賴 |
| 後端框架 | Node.js + Express + TypeScript | 輕量、成熟、易於擴展 |
| 資料庫 | PostgreSQL | ACID 保證，適合金融交易場景 |
| Session 暫存 | In-Memory Map (可升級 Redis) | Phase 1 簡化部署，未來可水平擴展 |
| Monorepo 工具 | npm workspaces | 零額外依賴，原生支援 |
| 測試 | Vitest (前後端共用) | 與 Vite 生態整合，速度快 |

### 1.4 系統架構總覽圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Game UI   │  │ State Manager│  │ Provably Fair Verifier   │  │
│  │ (4x4 Grid) │  │  (React Ctx) │  │ (Client-side SHA-256)    │  │
│  └─────┬─────┘  └──────┬───────┘  └──────────────────────────┘  │
│        │               │                                         │
│        └───────┬───────┘                                         │
│                │ HTTP REST                                        │
└────────────────┼─────────────────────────────────────────────────┘
                 │
┌────────────────┼─────────────────────────────────────────────────┐
│                │           Backend (Node.js)                      │
│  ┌─────────────▼──────────────┐                                  │
│  │       API Router           │                                  │
│  │  POST /game/start          │                                  │
│  │  POST /game/whack          │                                  │
│  │  POST /game/cashout        │                                  │
│  │  GET  /game/verify         │                                  │
│  └─────────────┬──────────────┘                                  │
│                │                                                  │
│  ┌─────────────▼──────────────┐                                  │
│  │       Game Engine          │                                  │
│  │  ┌──────────┐ ┌─────────┐  │                                  │
│  │  │ RTP Calc │ │Provably │  │                                  │
│  │  │  Module  │ │  Fair   │  │                                  │
│  │  └──────────┘ └─────────┘  │                                  │
│  │  ┌──────────┐ ┌─────────┐  │                                  │
│  │  │Multiplier│ │ Session │  │                                  │
│  │  │  Engine  │ │  Store  │  │                                  │
│  │  └──────────┘ └─────────┘  │                                  │
│  └─────────────┬──────────────┘                                  │
│                │                                                  │
│  ┌─────────────▼──────────────┐                                  │
│  │      DB Access Layer       │                                  │
│  └─────────────┬──────────────┘                                  │
└────────────────┼─────────────────────────────────────────────────┘
                 │
┌────────────────┼─────────────────────────────────────────────────┐
│                ▼        PostgreSQL                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐          │
│  │ bet_records   │ │ settlements  │ │ whack_logs       │          │
│  └──────────────┘ └──────────────┘ └──────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo 專案結構

```
game-lobby/apps/hitmous-game/     # 作為 game-lobby Monorepo 的子模組
├── package.json                  # Workspace 設定
├── tsconfig.base.json            # 共用 TypeScript 設定
├── .env.example                  # 環境變數範本
│
├── packages/
│   ├── shared/                   # 前後端共用模組
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/            # 共用型別定義
│   │       │   ├── game.ts       # GameSession, WhackResult, etc.
│   │       │   └── api.ts        # Request/Response DTOs
│   │       ├── constants.ts      # GRID_SIZE=16, RTP_OPTIONS, etc.
│   │       ├── multiplier.ts     # 賠率計算 (組合數學)
│   │       └── fairness.ts       # SHA-256 Hash 驗證工具
│   │
│   ├── server/                   # 後端服務
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          # Express 啟動入口
│   │       ├── config/
│   │       │   └── index.ts      # 環境變數 & RTP 設定載入
│   │       ├── routes/
│   │       │   └── game.ts       # /game/* 路由
│   │       ├── engine/
│   │       │   ├── GameEngine.ts # 遊戲核心引擎 (Class)
│   │       │   ├── SessionStore.ts  # 回合狀態暫存
│   │       │   └── ProvablyFair.ts  # Seed 生成 & 洗牌
│   │       ├── db/
│   │       │   ├── connection.ts # PostgreSQL 連線
│   │       │   ├── models/       # 資料表 Model
│   │       │   │   ├── BetRecord.ts
│   │       │   │   ├── Settlement.ts
│   │       │   │   └── WhackLog.ts
│   │       │   └── migrations/   # DB Migration 腳本
│   │       └── middleware/
│   │           ├── errorHandler.ts
│   │           └── validation.ts # 請求參數驗證
│   │
│   └── client/                   # 前端應用
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts        # base: '/hitmous-game/'
│       ├── index.html
│       └── src/
│           ├── main.tsx          # React 入口
│           ├── App.tsx           # 頂層路由 & Layout
│           ├── styles/
│           │   ├── variables.css # CSS Variables (色票/主題)
│           │   ├── global.css    # 全域 Reset & 基礎樣式
│           │   └── components/   # 各元件 CSS
│           ├── components/
│           │   ├── GameBoard/    # 4x4 網格主體
│           │   ├── Hole/         # 單一洞口元件
│           │   ├── Hammer/       # 敲擊動畫元件
│           │   ├── ControlPanel/ # 下注 & 空洞設定面板
│           │   ├── MultiplierDisplay/ # 動態倍率顯示
│           │   ├── CashoutOverlay/    # 結算彈窗 (Glassmorphism)
│           │   ├── GameOverOverlay/   # 遊戲結束彈窗
│           │   └── FairnessPanel/     # Provably Fair 驗證面板
│           ├── hooks/
│           │   ├── useGame.ts    # 遊戲邏輯 Custom Hook
│           │   └── useApi.ts     # API 呼叫封裝
│           ├── context/
│           │   └── GameContext.tsx # 全域遊戲狀態 Context
│           ├── services/
│           │   └── api.ts        # HTTP Client (fetch wrapper)
│           └── utils/
│               └── fairness.ts   # 前端 Seed 驗算
│
├── docs/
│   ├── system-design.md          # 本文件
│   └── mockups/                  # UI 原型圖
│
└── scripts/
    ├── simulate-rtp.ts           # RTP 模擬投注腳本
    └── seed-db.ts                # 測試資料填充
```

---

## 3. 前端架構設計

### 3.1 UI 狀態機 (State Machine)

依據 Mockup 畫面，遊戲存在 4 個主要 UI 狀態：

```
                  ┌───────────┐
                  │   IDLE    │  ← 啟動畫面 (start_screen)
                  │ (Start)   │     設定下注金額 & 空洞數
                  └─────┬─────┘
                        │ [START GAME]
                        ▼
                  ┌───────────┐
            ┌────▶│  PLAYING  │  ← 遊戲進行中 (playing_screen)
            │     │ (Whacking) │     點擊洞口、即時倍率更新
            │     └──┬──┬──┬──┘
            │        │  │  │
            │ [HIT   │  │  │ [HIT EMPTY]
            │  MOLE] │  │  │
            │        │  │  ▼
            │        │  │ ┌───────────┐
            └────────┘  │ │ GAME_OVER │  ← 遊戲結束 (bomb_screen)
                        │ │  (Miss!)  │     揭曉所有位置 + 公開 Seed
                        │ └───────────┘
                        │
                        │ [CASHOUT] or [FULL CLEAR]
                        ▼
                  ┌───────────┐
                  │  CASHOUT  │  ← 結算成功 (cashout_screen)
                  │ (Collect) │     顯示 TOTAL PAYOUT
                  └───────────┘
```

### 3.2 元件樹 (Component Tree)

```
<App>                                  // 佈局靠頂部 (justify-content: flex-start, padding-top: 24px)
  └── <GameContext.Provider>
        ├── <ControlPanel />          // 左側：餘額、下注金額(步進10,初始$100)、空洞數選擇、START/CASHOUT/PLAY AGAIN 按鈕
        │                             // 寬度 280px，字體放大，對齊 flex-start
        ├── <GameBoard>               // 中央：4x4 網格
        │     └── <Hole /> × 16      // 單一洞口 (含 Mole 動畫)
        │           └── <Hammer />    // 敲擊特效 (CSS Animation)
        ├── <MultiplierDisplay />     // 右上：僅顯示 Total Multiplier（已移除 "Next" 行）
        ├── <JackpotBar />            // 頂部：JACKPOT 金額顯示（已隱藏）
        ├── <CashoutOverlay />        // 條件渲染：成功結算 Glassmorphism 彈窗（移除 "USD" 字眼）
        ├── <GameOverOverlay />       // 條件渲染：MISS! GAME OVER 彈窗（顯示 -$betAmount）
        ├── <FullClearOverlay />      // 條件渲染：FULL CLEAR! 完全過關彈窗
        └── <FairnessPanel />         // 折疊面板：顯示 Seed Hash & 驗證（已隱藏）

手機版 (@media max-width: 768px)：
  - 上下堆疊佈局（遊戲板在上、控制面板在下）
  - 面板 padding: 10px 12px, gap: 6px, 按鈕高度: 30px, 字體縮小
  - Overlay 元素壓縮
```

### 3.3 遊戲狀態管理 (GameContext)

使用 React Context + `useReducer` 管理全域遊戲狀態：

```typescript
// packages/shared/src/types/game.ts

type GamePhase = 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'CASHOUT';

interface HoleState {
  index: number;
  status: 'hidden' | 'whacked_mole' | 'whacked_empty' | 'revealed_mole' | 'revealed_empty';
}

interface GameState {
  phase: GamePhase;
  sessionId: string | null;
  betAmount: number;              // 初始值 $100，步進值 10
  emptyHoleCount: number;
  rtpSetting: 94 | 96 | 97 | 98 | 99;
  holes: HoleState[];            // 16 個洞口狀態
  whackedCount: number;          // 已敲中地鼠數
  currentMultiplier: number;     // 目前倍率
  nextMultiplier: number;        // 下一次成功後的倍率 (預覽)
  payout: number;                // 結算獎金 (CASHOUT 後)
  serverSeedHash: string | null; // 回合開始時收到的 Hash
  serverSeed: string | null;     // 回合結束後公開的 Seed
  layout: number[] | null;       // 回合結束後公開的洞口佈局
}

type GameAction =
  | { type: 'SET_BET'; betAmount: number }
  | { type: 'SET_EMPTY_HOLES'; count: number }
  | { type: 'GAME_STARTED'; sessionId: string; serverSeedHash: string }
  | { type: 'WHACK_RESULT_MOLE'; holeIndex: number; newMultiplier: number; nextMultiplier: number }
  | { type: 'WHACK_RESULT_EMPTY'; holeIndex: number; serverSeed: string; layout: number[] }
  | { type: 'FULL_CLEAR_SUCCESS'; holeIndex: number; payout: number; serverSeed: string; layout: number[] }
  | { type: 'CASHOUT_SUCCESS'; payout: number; serverSeed: string; layout: number[] }
  | { type: 'RESET' };
```

### 3.4 UI 設計規範 (Design Tokens)

依據 Mockup 的 Premium Casino / Glassmorphism 風格：

```css
/* packages/client/src/styles/variables.css */

:root {
  /* 色票 */
  --color-bg-primary: #0a0e1a;         /* 深色背景 */
  --color-bg-secondary: #151a2e;       /* 面板背景 */
  --color-accent-green: #39ff14;       /* 霓虹綠 (CTA & 成功) */
  --color-accent-purple: #8b5cf6;      /* 洞口/裝飾紫 */
  --color-accent-gold: #fbbf24;        /* 地鼠/金幣色 */
  --color-accent-red: #ef4444;         /* 失敗/GAME OVER */
  --color-text-primary: #ffffff;
  --color-text-secondary: #94a3b8;

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-blur: 12px;

  /* 控制面板尺寸與字體 */
  --panel-width: 280px;                /* 控制面板寬度 */
  --font-label: 0.8rem;               /* Label 字體大小 */
  --font-balance: 1.5rem;             /* 餘額字體大小 */
  --font-input: 1.1rem;               /* 輸入框字體大小 */
  --btn-size: 36px;                   /* 加減按鈕尺寸 */

  /* 圓角 */
  --radius-hole: 50%;                  /* 洞口圓形 */
  --radius-card: 16px;                 /* 卡片圓角 */
  --radius-button: 12px;              /* 按鈕圓角 */

  /* 動畫 */
  --anim-whack-duration: 200ms;        /* 敲擊動畫時長 */
  --anim-mole-popup: 300ms;            /* 地鼠彈出動畫 */
  --anim-multiplier-bounce: 400ms;     /* 倍率跳動動畫 */
}
```

### 3.5 關鍵動畫設計

| 動畫 | 觸發時機 | 實作方式 |
|------|----------|----------|
| 地鼠彈出 | 敲中地鼠洞口 | CSS `@keyframes` scale + translateY |
| 槌子敲擊 | 點擊洞口瞬間 | CSS `transform: rotate(-30deg)` 回彈 |
| 倍率跳動 | 倍率更新時 | CSS `@keyframes` scale pulse + 綠色閃光 |
| 空洞爆炸 | 敲中空洞 | CSS `@keyframes` shake + 紅色閃屏 |
| 結算飄落 | Cashout 成功 | CSS `@keyframes` 金幣落下粒子效果 |
| Glassmorphism 彈窗 | Overlay 出現 | CSS `backdrop-filter: blur()` + fadeIn |

---

## 4. 後端架構設計

### 4.1 模組依賴圖

```
routes/game.ts
    │
    ▼
engine/GameEngine.ts  ◄──── 核心控制器 (Singleton)
    │
    ├── engine/ProvablyFair.ts     ← Seed 生成 / 洗牌 / Hash
    ├── engine/SessionStore.ts     ← 回合狀態暫存 (Map)
    ├── shared/multiplier.ts       ← 賠率計算 (組合數學)
    └── db/models/*                ← 資料庫讀寫
```

### 4.2 GameEngine 核心類別

```typescript
// packages/server/src/engine/GameEngine.ts

class GameEngine {
  private sessionStore: SessionStore;
  private provablyFair: ProvablyFair;

  /** 開始新回合 */
  async startGame(params: {
    playerId: string;
    betAmount: number;
    emptyHoleCount: number;  // 1~15
    rtpSetting: number;
  }): Promise<StartGameResponse>;

  /** 敲擊洞口 */
  async whack(params: {
    sessionId: string;
    holeIndex: number;  // 0~15
  }): Promise<WhackResponse>;

  /** 兌現 */
  async cashout(params: {
    sessionId: string;
  }): Promise<CashoutResponse>;

  /** 驗證公平性 (回合結束後) */
  verifyFairness(params: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    emptyHoleCount: number;
  }): VerifyResponse;
}
```

### 4.3 SessionStore 設計

回合狀態暫存於記憶體中，使用 `Map<string, GameSession>` 結構：

```typescript
// packages/server/src/engine/SessionStore.ts

interface GameSession {
  sessionId: string;
  playerId: string;
  betAmount: number;
  emptyHoleCount: number;
  rtpSetting: number;
  layout: number[];           // 洞口佈局 [0=地鼠, 1=空洞]，長度 16
  serverSeed: string;         // 原始 Server Seed
  serverSeedHash: string;     // SHA-256(serverSeed)
  whackedHoles: number[];     // 已敲擊的洞口 index 列表
  currentMultiplier: number;
  status: 'active' | 'settled';
  createdAt: Date;
}

class SessionStore {
  private sessions: Map<string, GameSession> = new Map();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 分鐘逾時

  create(session: GameSession): void;
  get(sessionId: string): GameSession | undefined;
  update(sessionId: string, partial: Partial<GameSession>): void;
  delete(sessionId: string): void;
  cleanup(): void;  // 定時清理過期 Session
}
```

### 4.4 請求驗證層

所有 API 端點必須經過以下驗證：

| 驗證項目 | 說明 |
|----------|------|
| **參數合法性** | `emptyHoleCount` ∈ [1, 15]，`holeIndex` ∈ [0, 15]，`betAmount` > 0 |
| **Session 存在** | `whack`/`cashout` 必須提供有效的 `sessionId` |
| **Session 歸屬** | Session 的 `playerId` 必須與請求者一致 |
| **重複敲擊** | 同一 `holeIndex` 不得重複敲擊 |
| **狀態合法** | 只有 `status: 'active'` 的 Session 才允許操作 |

---

## 5. API 規格定義

### 5.1 POST /game/start

開始新回合，初始化洞口佈局。

**Request:**
```json
{
  "playerId": "user_888",
  "betAmount": 50.00,
  "emptyHoleCount": 3,
  "rtpSetting": 97
}
```

**Response (200):**
```json
{
  "sessionId": "sess_abc123",
  "serverSeedHash": "b3f9c1e2b84d...",
  "currentMultiplier": 1.00,
  "nextMultiplier": 1.194,
  "totalMoles": 13,
  "totalHoles": 16
}
```

### 5.2 POST /game/whack

敲擊指定洞口，回傳結果。

**Request:**
```json
{
  "sessionId": "sess_abc123",
  "holeIndex": 5
}
```

**Response - 敲中地鼠 (200):**
```json
{
  "result": "mole",
  "holeIndex": 5,
  "currentMultiplier": 1.194,
  "nextMultiplier": 1.492,
  "whackedCount": 1,
  "remainingMoles": 12
}
```

**Response - 完全過關 Full Clear (200):**
當 `remainingMoles` = 0 時，系統自動以最終倍率結算：
```json
{
  "result": "full_clear",
  "holeIndex": 5,
  "currentMultiplier": 1.897,
  "payout": 94.85,
  "serverSeed": "raw_seed_value",
  "layout": [0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0]
}
```

**Response - 敲中空洞 (200):**
```json
{
  "result": "empty",
  "holeIndex": 5,
  "payout": 0,
  "serverSeed": "raw_seed_value",
  "layout": [0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0]
}
```

### 5.3 POST /game/cashout

兌現結算獎金。

**Request:**
```json
{
  "sessionId": "sess_abc123"
}
```

**Response (200):**
```json
{
  "payout": 107.50,
  "currentMultiplier": 2.15,
  "serverSeed": "raw_seed_value",
  "layout": [0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0]
}
```

### 5.4 GET /game/verify

供玩家驗證回合公平性。

**Query Params:** `serverSeed`, `clientSeed`, `nonce`, `emptyHoleCount`

**Response (200):**
```json
{
  "isValid": true,
  "computedHash": "b3f9c1e2b84d...",
  "computedLayout": [0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0]
}
```

### 5.5 錯誤回應格式

所有錯誤統一使用以下格式：

```json
{
  "error": {
    "code": "INVALID_HOLE_INDEX",
    "message": "Hole index must be between 0 and 15."
  }
}
```

**錯誤代碼列表:**

| Code | HTTP Status | 說明 |
|------|-------------|------|
| `INVALID_PARAMS` | 400 | 請求參數不合法 |
| `SESSION_NOT_FOUND` | 404 | 找不到指定的 Session |
| `SESSION_EXPIRED` | 410 | Session 已逾時 |
| `SESSION_ALREADY_SETTLED` | 409 | 回合已結算 |
| `DUPLICATE_WHACK` | 409 | 洞口已被敲擊過 |
| `INVALID_HOLE_INDEX` | 400 | 洞口索引超出範圍 |
| `INSUFFICIENT_BALANCE` | 402 | 餘額不足 |

---

## 6. 資料模型設計

### 6.1 ER Diagram

```
┌──────────────────────┐     ┌──────────────────────┐
│     bet_records       │     │     whack_logs        │
├──────────────────────┤     ├──────────────────────┤
│ bet_id (PK)          │     │ draw_id (PK)          │
│ session_id (UNIQUE)  │────▶│ session_id (FK)       │
│ player_id            │     │ crash_multiplier      │
│ bet_amount (DECIMAL) │     │ server_seed           │
│ empty_hole_count     │     │ server_seed_hash      │
│ rtp_setting          │     │ client_seed           │
│ volatility_level     │     │ created_at            │
│ status               │     │ crashed_at            │
│ auto_cashout         │     └──────────────────────┘
│ whacked_holes (JSONB)│
│ current_multiplier   │     ┌──────────────────────┐
│ server_seed_hash     │     │    settlements        │
│ created_at           │     ├──────────────────────┤
│ updated_at           │     │ settlement_id (PK)    │
└──────────────────────┘────▶│ session_id (FK)       │
                              │ bet_id (FK)           │
                              │ outcome (win/lose)    │
                              │ cashout_multiplier    │
                              │ payout (DECIMAL)      │
                              │ profit (DECIMAL)      │
                              │ settled_at            │
                              └──────────────────────┘
```

### 6.2 DDL 定義

> 對標 `rocketLH` 標準化資料結構。

```sql
-- 注單記錄表
CREATE TABLE bet_records (
    bet_id            VARCHAR(64) PRIMARY KEY,         -- e.g. BET-HITMOUS-20260317-P1
    session_id        VARCHAR(64) UNIQUE NOT NULL,
    player_id         VARCHAR(64) NOT NULL,
    bet_amount        DECIMAL(12, 2) NOT NULL CHECK (bet_amount > 0),
    empty_hole_count  SMALLINT NOT NULL CHECK (empty_hole_count BETWEEN 1 AND 15),
    rtp_setting       SMALLINT NOT NULL CHECK (rtp_setting IN (94, 96, 97, 98, 99)),
    volatility_level  SMALLINT NOT NULL DEFAULT 3,     -- 波動度等級
    status            VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled')),
    auto_cashout      DECIMAL(10, 2),                  -- 自動兌現倍率 (nullable)
    whacked_holes     JSONB NOT NULL DEFAULT '[]',
    current_multiplier DECIMAL(10, 4) NOT NULL DEFAULT 1.0000,
    server_seed_hash  VARCHAR(128) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bet_records_player_id ON bet_records (player_id);
CREATE INDEX idx_bet_records_status ON bet_records (status);

-- 開獎記錄表
CREATE TABLE whack_logs (
    draw_id           VARCHAR(64) PRIMARY KEY,         -- e.g. WHACK-LOG-20260317-D1
    session_id        VARCHAR(64) NOT NULL REFERENCES bet_records(session_id),
    crash_multiplier  DECIMAL(10, 4) NOT NULL,         -- 最終倍率
    server_seed       VARCHAR(128) NOT NULL,
    server_seed_hash  VARCHAR(128) NOT NULL,
    client_seed       VARCHAR(128),                    -- 玩家自訂 Seed (nullable)
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    crashed_at        TIMESTAMPTZ                      -- 回合結束時間 (nullable)
);

CREATE INDEX idx_whack_logs_session_id ON whack_logs (session_id);

-- 結算記錄表
CREATE TABLE settlements (
    settlement_id     VARCHAR(64) PRIMARY KEY,         -- e.g. SETTLE-HITMOUS-20260317-S1
    session_id        VARCHAR(64) NOT NULL REFERENCES bet_records(session_id),
    bet_id            VARCHAR(64) NOT NULL REFERENCES bet_records(bet_id),
    outcome           VARCHAR(8) NOT NULL CHECK (outcome IN ('win', 'lose')),
    cashout_multiplier DECIMAL(10, 4) NOT NULL,        -- 兌現倍率
    payout            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    profit            DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- 淨利潤 (payout - betAmount)
    settled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settlements_bet_id ON settlements (bet_id);
```

---

## 7. 核心演算法模組

### 7.1 組合數學賠率計算

```typescript
// packages/shared/src/multiplier.ts

const GRID_SIZE = 16;

/**
 * 計算組合數 C(n, k) = n! / (k! * (n-k)!)
 * 使用迭代法避免大數溢位
 */
function combination(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

/**
 * 計算第 d 次敲中地鼠後的累積倍率
 * @param emptyHoles - 空洞數量 (e)
 * @param whackedCount - 已敲中的地鼠數 (d)
 * @param rtp - RTP 百分比 (94 | 96 | 97 | 98 | 99)
 * @returns 累積倍率 (Multiplier)
 */
function calculateMultiplier(emptyHoles: number, whackedCount: number, rtp: number): number {
  // Multiplier = (RTP / 100) × [ C(16, d) / C(16 - e, d) ]
  const fairMultiplier = combination(GRID_SIZE, whackedCount)
                        / combination(GRID_SIZE - emptyHoles, whackedCount);
  return Math.floor((rtp / 100) * fairMultiplier * 10000) / 10000; // 無條件捨去至小數 4 位
}
```

### 7.2 賠率表預計算

系統啟動時預先計算所有可能的 `(emptyHoles, whackedCount, rtp)` 組合的倍率表，避免即時運算開銷：

```typescript
// 預計算結構: multiplierTable[rtp][emptyHoles][whackedCount]
type MultiplierTable = Record<number, Record<number, number[]>>;

function buildMultiplierTable(): MultiplierTable {
  const rtpOptions = [94, 96, 97, 98, 99];
  const table: MultiplierTable = {};

  for (const rtp of rtpOptions) {
    table[rtp] = {};
    for (let e = 1; e <= 15; e++) {
      const maxMoles = GRID_SIZE - e; // 地鼠數量
      table[rtp][e] = [1]; // d=0 時倍率為 1
      for (let d = 1; d <= maxMoles; d++) {
        table[rtp][e].push(calculateMultiplier(e, d, rtp));
      }
    }
  }

  return table;
}
```

---

## 8. Provably Fair 機制設計

### 8.1 機制流程

```
回合開始前:
  Server 產生: serverSeed (隨機 32 bytes hex)
  Server 計算: serverSeedHash = SHA-256(serverSeed)
  Server 回傳: serverSeedHash → 前端顯示 (承諾)

回合進行中:
  佈局由 serverSeed + emptyHoleCount 決定 (洗牌演算法)
  玩家只能看到 Hash，無法反推佈局

回合結束後 (空洞/兌現):
  Server 公開: serverSeed + layout
  前端驗證: SHA-256(serverSeed) === 先前收到的 serverSeedHash
  前端驗證: 用 serverSeed 重新洗牌 → 結果與 layout 一致
```

### 8.2 洗牌演算法 (Fisher-Yates with Seed)

```typescript
// packages/server/src/engine/ProvablyFair.ts

import crypto from 'crypto';

class ProvablyFair {
  /**
   * 產生 Server Seed
   */
  generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 計算 Hash
   */
  hashSeed(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  /**
   * 基於 Seed 的確定性洗牌，生成洞口佈局
   * @returns number[] - 長度 16 的陣列，0=地鼠, 1=空洞
   */
  generateLayout(serverSeed: string, emptyHoleCount: number): number[] {
    // 初始佈局：前 emptyHoleCount 個為空洞，其餘為地鼠
    const layout = Array(GRID_SIZE).fill(0);
    for (let i = 0; i < emptyHoleCount; i++) {
      layout[i] = 1;
    }

    // Fisher-Yates Shuffle (使用 HMAC-SHA256 生成確定性隨機數)
    for (let i = GRID_SIZE - 1; i > 0; i--) {
      const hmac = crypto.createHmac('sha256', serverSeed)
                         .update(`${i}`)
                         .digest('hex');
      const randomValue = parseInt(hmac.substring(0, 8), 16);
      const j = randomValue % (i + 1);
      [layout[i], layout[j]] = [layout[j], layout[i]];
    }

    return layout;
  }
}
```

### 8.3 前端驗證工具

```typescript
// packages/shared/src/fairness.ts (前後端共用)

/**
 * 玩家可在前端自行驗證:
 * 1. serverSeedHash 是否匹配
 * 2. layout 是否可由 serverSeed 重現
 */
async function verifySeedHash(serverSeed: string, expectedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(serverSeed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === expectedHash;
}
```

---

## 9. 安全性設計

### 9.1 威脅模型與對策

| 威脅 | 風險等級 | 對策 |
|------|----------|------|
| **結果竄改** - 玩家修改 whack 請求偽造結果 | 高 | 後端為唯一權威，佈局僅存於 Server，前端無法影響判定 |
| **重放攻擊** - 重複提交相同 whack 請求 | 中 | SessionStore 記錄已敲擊洞口，重複 index 直接拒絕 |
| **Session 劫持** - 盜用他人 Session | 中 | Session 綁定 playerId，每次請求驗證歸屬 |
| **時序攻擊** - 透過回應時間推測佈局 | 低 | 所有 whack 請求使用相同邏輯路徑，回應時間一致 |
| **暴力猜測** - 嘗試推算 Server Seed | 低 | SHA-256 單向函數，32 bytes 隨機 Seed (2^256 組合) |
| **超額投注** - 下注金額超過餘額 | 高 | 開局時驗證餘額並預扣 (需整合錢包系統) |

### 9.2 輸入驗證規則

```typescript
// packages/server/src/middleware/validation.ts

const startGameSchema = {
  playerId: { type: 'string', required: true, minLength: 1 },
  betAmount: { type: 'number', required: true, min: 0.01 },
  emptyHoleCount: { type: 'integer', required: true, min: 1, max: 15 },
  rtpSetting: { type: 'integer', required: true, enum: [94, 96, 97, 98, 99] },
};

const whackSchema = {
  sessionId: { type: 'string', required: true },
  holeIndex: { type: 'integer', required: true, min: 0, max: 15 },
};

const cashoutSchema = {
  sessionId: { type: 'string', required: true },
};
```

### 9.3 Rate Limiting

| 端點 | 限制 |
|------|------|
| `POST /game/start` | 每位玩家每秒 2 次 |
| `POST /game/whack` | 每個 Session 每秒 5 次 |
| `POST /game/cashout` | 每個 Session 限 1 次 |

---

## 10. 測試策略

### 10.1 測試層級

```
┌─────────────────────────────────────┐
│        E2E Tests (Playwright)       │  完整遊戲流程
├─────────────────────────────────────┤
│      Integration Tests (Vitest)     │  API 端點 + DB
├─────────────────────────────────────┤
│        Unit Tests (Vitest)          │  純函數 & 模組
└─────────────────────────────────────┘
```

### 10.2 關鍵測試案例

**Unit Tests (shared/multiplier):**
- 組合數 C(n, k) 邊界值：C(16, 0)=1, C(16, 16)=1, C(16, 1)=16
- 各 RTP / 空洞數 / 敲中數的倍率計算是否符合對照表
- 倍率隨敲中數單調遞增

**Unit Tests (server/ProvablyFair):**
- 相同 Seed 生成相同 Layout (確定性)
- 不同 Seed 生成不同 Layout (隨機性)
- Layout 中空洞數量正確
- Hash 驗證前後端一致

**Unit Tests (server/GameEngine):**
- startGame → 正確初始化 Session
- whack 地鼠 → 倍率正確更新
- whack 空洞 → 回合結束、payout=0
- cashout → 計算正確獎金
- 重複 whack 同一洞口 → 拒絕
- Session 逾時 → 自動清理

**Integration Tests (API):**
- 完整遊戲流程：start → whack × N → cashout
- 完整失敗流程：start → whack (空洞) → game over
- 參數驗證 (400 errors)
- Session 不存在 (404 errors)

**RTP 模擬驗證 (scripts/simulate-rtp.ts):**
- 對每個 RTP 設定值進行 100,000+ 局自動化投注模擬
- 驗證最終回報率是否落在設定值 ± 1.0% 範圍內

### 10.3 RTP 模擬腳本設計

```typescript
// scripts/simulate-rtp.ts

async function simulateRTP(params: {
  rtpSetting: number;
  emptyHoleCount: number;
  rounds: number;       // 模擬局數 (建議 100,000+)
  betAmount: number;
}): Promise<{
  totalBet: number;
  totalPayout: number;
  actualRTP: number;
  deviation: number;    // 與設定值的偏差百分比
}>;
```

---

## 11. 大廳錢包整合

### 11.1 錢包 API 串接
遊戲結算時，透過大廳 API Client 進行餘額操作：

| API 端點 | 用途 |
|----------|------|
| `GET /lobby/api/game/balance` | 取得玩家即時餘額（遊戲開始前 & 每局結束後） |
| `POST /lobby/api/game/settle` | 結算下注與獎金 |
| `POST /lobby/api/game/close-session` | 關閉遊戲 Session（玩家離開遊戲時） |

### 11.2 認證機制
- 遊戲前端透過大廳發放的 **Game Session Token**（短效 JWT，30 分鐘有效）存取玩家餘額
- 遊戲後端透過 **X-Game-Secret** Header（共享金鑰）呼叫大廳結算 API

---

## 12. 部署架構

### 12.1 開發環境

```
npm run dev
  ├── client (Vite dev server) → http://localhost:5176 (內部開發用)
  └── server (ts-node-dev)     → http://localhost:3004 (內部開發用)
```

- Vite dev server 透過 `proxy` 設定將 `/game/*` 請求轉發至後端。
- 透過 game-lobby 的 Unified Gateway（Port 3001/3002）統一對外提供 `/hitmous-game/` 路由。

### 12.2 整合架構

```
                  Unified Gateway (game-lobby)
                  ┌────────────────────────────────────┐
Browser ──────►   │ Port 3001 /hitmous-game/ → 前端     │
                  │ Port 3002 /hitmous-game/ → 後端 API │
                  └────────────┬───────────────────────┘
                               │ (結算)
                               ▼
                  大廳後端 Wallet API
                  POST /lobby/api/game/settle
```

### 12.3 生產環境

```
┌──────────────────────────────────────────────┐
│           game-lobby Unified Gateway          │
│         (Port 3001 前端 / Port 3002 API)      │
├──────────────────────┬───────────────────────┤
│   /hitmous-game/     │   /hitmous-game/      │
│   Static Files       │   API Proxy           │
│   (client/dist/)     │        │              │
│                      │        ▼              │
│                      │   Node.js Server      │
│                      │        │              │
│                      │        ▼              │
│                      │   PostgreSQL          │
│                      │   (+ Redis optional)  │
└──────────────────────┴───────────────────────┘
```

### 12.4 環境變數

```bash
# .env.example

# Server
PORT=3004
NODE_ENV=production
BASE_URL=/hitmous-game/

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/whack_a_mole

# Game Config
DEFAULT_RTP=97
SESSION_TTL_MINUTES=30

# 大廳整合
LOBBY_API_URL=http://localhost:3002/lobby
GAME_SECRET=hitmous-shared-secret

# 非大廳模式（獨立運行時使用的初始餘額）
DEFAULT_BALANCE=1000

# Redis (optional, for horizontal scaling)
# REDIS_URL=redis://localhost:6379

# Security
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX_REQUESTS=10
```

---

## 附錄 A: 開發階段對照

| Phase | 涵蓋的系統設計章節 | 交付物 |
|-------|---------------------|--------|
| Phase 1 | §2 (結構), §7 (演算法) | Monorepo 骨架 + `shared/multiplier.ts` + Unit Tests |
| Phase 2 | §4 (後端), §5 (API), §6 (DB), §8 (Fair) | GameEngine + API + ProvablyFair + DB Migration |
| Phase 3 | §3 (前端) | React UI + 動畫 + API 串接 |
| Phase 4 | §10 (測試), §11 (大廳整合), §12 (部署) | E2E Tests + RTP 模擬 + 大廳錢包串接 + 部署設定 |

---

## v1.4 更新紀錄 (2026-03-17)

### 資料結構
1. **標準化資料結構**：更新 `bet_records`、`settlements` 與 `whack_logs` 格式，與 `rocketLH` 保持一致。
2. **`draw_logs` → `whack_logs`**：資料表更名，新增 `crash_multiplier`、`client_seed`、`crashed_at` 欄位。
3. **`settlements`**：`final_multiplier` → `cashout_multiplier`，新增 `profit` 欄位。
4. **`bet_records`**：新增 `volatility_level`、`auto_cashout` 欄位；ID 長度擴展至 VARCHAR(64)。
5. **Monorepo**：`DrawLog.ts` → `WhackLog.ts`。

---

## v1.3 更新紀錄 (2026-03-16)

### 前端修正
1. **ControlPanel**：步進值 10、初始下注 $100；面板寬度 280px、字體放大。
2. **App 佈局**：靠頂部對齊（`justify-content: flex-start`）。
3. **MultiplierDisplay**：右上角移除 "Next" 行，只顯示 Total Multiplier。
4. **CashoutOverlay**：移除 "USD" 字眼。
5. **手機版佈局**：上下堆疊（遊戲板在上、控制面板在下），`@media (max-width: 768px)` 響應式切換。
6. **手機版壓縮**：面板 padding 10px 12px, gap 6px, 按鈕 30px, 字體縮小。
7. **手機版 Overlay 壓縮**：元素尺寸與間距壓縮。

### PWA 通用修正
1. Viewport meta：`width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`。
2. 全域 CSS：`100vh` → `100dvh`，`-webkit-text-size-adjust: 100%`。
3. 手機版響應式斷點：`@media (max-width: 768px)`。

### Mockup 截圖
- 桌面版：`apps/hitmous-game/docs/mockups/desktop/hitmous_idle.png`
- 手機版：`apps/hitmous-game/docs/mockups/mobile/hitmous_idle_mobile.png`

---

*文件版本：v1.4 | 日期：2026-03-17*
