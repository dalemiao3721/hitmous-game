# 打地鼠機率遊戲 (Whack-A-Mole Game) - 專案提案書 (Proposal)

## 1. 專案背景與目標
本專案旨在使用現代化的前後端技術（Vite + React & Node.js），開發一款以經典「打地鼠」為主題的機率遊戲，功能規格精確對標 `mines-game`。
此遊戲的特色為**高透明度 (Provably Fair)** 與 **彈性的回報率設定 (Configurable RTP)**，確保營運方與玩家之間建立信任，同時提供具備打地鼠特色的動態視覺體驗。

## 2. 遊戲核心規則
- **網格範圍**：4x4 網格（共 16 個洞口）。
- **難度自訂**：玩家於單局開始前，可選擇 1 到 15 個「空洞 (Empty Holes)」隱藏於 16 個位置中。其餘洞口藏有地鼠。
- **遊玩流程**：
  - **終止與結算條件**：
  1. **兌現 (Cashout)**：玩家可隨時點擊「兌現」按鈕，以目前的獎金倍數結算。結算獎金 = `下注金額 × 目前倍率`。
  2. **完全過關 (Full Clear)**：若玩家成功敲中所有藏有地鼠的洞口，系統將自動以最終最高倍數進行結算。
  3. **敲中空洞 (Whack an Empty Hole)**：遊戲立即結束，**下注金額全數沒收**，獎金歸零。

## 3. 數學模型與可調整機率模組 (RTP)
本專案支援與 Mines Game 相同的**五段式設定機率模組**。
系統將從設定檔讀取全域 RTP (Return to Player) 參數，確保精準控制莊家優勢 (House Edge)。

- **支援的 RTP 設定值**：`94%`, `96%`, `97%`, `98%`, `99%`。

### 📊 賠率 (Multiplier) 計算公式
賠率的計算基於「組合數學 (Combinatorics)」。
- `n` = 總格子數 (16)
- `e` = 空洞數量 (1 ~ 15)
- `d` = 玩家已敲中的地鼠數量

**實際賠率公式**：
`Multiplier = (RTP / 100) * [ C(16, d) / C(16 - e, d) ]`

## 4. 系統技術架構 (Monorepo)
為了兼顧開發效率、部署便利性與安全性，專案劃分為以下兩個核心微服務：

### 4.1 前端 (Frontend)
負責呈現打地鼠的敲擊快感與流暢的物理動畫。
- **核心技術**：Vite + React + TypeScript
- **樣式與 UI**：Vanilla CSS (搭配 CSS Variables 實現 Premium UI 設計)。
- **職責**：4x4 洞口渲染、槌子敲擊特效、動態倍率跳動、處理與後端的 WebSocket/HTTP API 通訊。

### 4.2 後端 (Backend)
負責處理機率、結算邏輯與公平性驗證。
- **核心技術**：Node.js (Express 或 Fastify) + TypeScript
- **職責**：
  - **Provably Fair 機制**：每局開場生成一組 `Server Seed`，在伺服器端洗牌地鼠與空洞位置，僅傳送 Hash 給前端。
  - **RTP 引擎**：負責結算贏得的獎金與倍率。
  - **狀態驗證**：防止玩家透過修改請求竄改敲擊結果。

## 5. 開發階段規劃
1. **Phase 1: 專案初始化與提案審核** (當前階段)
   - 初始化 GitHub Repository。
   - 建立 Vite + Node.js Monorepo 環境。
   - 完成 RTP 機率計算 Utils（涵蓋組合數學實作與單元測試）。
2. **Phase 2: 機率演算與後端核心開發** (包含 Provably Fair 邏輯)
   - 實作 Provably Fair (可證明公平) 的生成邏輯。
   - 建立遊戲流程的 API 端點 (Start, Whack, Cashout)。
3. **Phase 3: 前端 UI 與打地鼠特效開發**
   - 建立支援 TailwindCSS 的高品質遊戲介面 (Premium UI)。
   - 串接後端 API，完成完整遊戲的 Lifecycle。
4. **Phase 4: 整合測試與模擬投注驗證**
   - E2E 流程驗證。
   - 在各 RTP 參數下進行大量自動化投注模擬，驗證最終的回報率是否精準貼合設定值。

---

## 6. 系統架構圖

```mermaid
graph TB
    subgraph Client["🖥️  前端 (Browser / Vite + React + TS)"]
        UI["遊戲 UI\n4x4 洞口 + 槌子特效"]
        State["狀態管理\n(當前倍率 / 敲擊狀態)"]
        FairVerify["Provably Fair 驗算工具\n(玩家自行驗證 Seed)"]
    end

    subgraph Backend["⚙️  後端 (Node.js + Express + TS)"]
        Router["API Router\n(REST / WebSocket)"]
        GameEngine["遊戲引擎\n(邏輯核心)"]
        RTPModule["RTP 模組\n設定: 94 / 96 / 97 / 98 / 99%"]
        MultiplierCalc["賠率計算引擎\n(16 洞口組合數學)"]
        ProvenFair["Provably Fair 產生器\n(Server Seed + Hash)"]
        SessionStore["回合狀態暫存\n(記憶體 / Redis)"]
        DBWriter["資料庫寫入層\n(BetRecord / Settlement / DrawLog)"]
    end

    subgraph Database["🗄️  資料庫 (PostgreSQL / MongoDB)"]
        BetTable["注單表 bet_records"]
        SettleTable["結算表 settlements"]
        DrawTable["開獎紀錄表 draw_logs"]
    end

    UI -- "HTTP / WS 請求" --> Router
    Router --> GameEngine
    GameEngine --> RTPModule
    GameEngine --> MultiplierCalc
    GameEngine --> ProvenFair
    GameEngine --> SessionStore
    GameEngine --> DBWriter
    DBWriter --> BetTable
    DBWriter --> SettleTable
    DBWriter --> DrawTable
    Router -- "回傳倍率 / 結果" --> State
    State --> UI
    ProvenFair -- "回合結束公開 Seed" --> FairVerify
```

---

## 7. 遊戲流程圖

```mermaid
sequenceDiagram
    participant P as 玩家 (Frontend)
    participant B as 後端 API
    participant G as 遊戲引擎
    participant DB as 資料庫

    P->>B: POST /game/start<br/>{ betAmount, emptyHoleCount, rtp }
    B->>G: 初始化回合<br/>生成 Server Seed & 洗牌位置
    G->>DB: 建立注單 (bet_records)<br/>status: "active"
    G-->>B: sessionId + serverSeedHash
    B-->>P: { sessionId, serverSeedHash, multiplier: 1.00 }

    loop 玩家持續敲擊洞口
        P->>B: POST /game/whack<br/>{ sessionId, holeIndex }
        B->>G: 驗證洞口 (地鼠 or 空洞?)
        alt 敲中地鼠
            G->>DB: 更新注單狀態<br/>whackedHoles[], currentMultiplier
            G-->>B: isSafe: true + 新倍率
            B-->>P: { result: "mole", newMultiplier }
        else 敲中空洞!
            G->>DB: 建立開獎記錄 (draw_logs)<br/>layout, serverSeed
            G->>DB: 建立結算記錄 (settlements)<br/>outcome: "lose", payout: 0
            G->>DB: 更新注單 (bet_records)<br/>status: "settled"
            G-->>B: isSafe: false + 公開 Seed
            B-->>P: { result: "miss", serverSeed, layout }
            Note over P,DB: 回合結束 💥 擊中空洞
        end
    end

    P->>B: POST /game/cashout<br/>{ sessionId }
    B->>G: 計算最終獎金<br/>= betAmount × currentMultiplier
    G->>DB: 建立開獎記錄 (draw_logs)<br/>layout, serverSeed
    G->>DB: 建立結算記錄 (settlements)<br/>outcome: "win", payout
    G->>DB: 更新注單 (bet_records)<br/>status: "settled"
    G-->>B: payout + 公開 Server Seed
    B-->>P: { payout, serverSeed, layout }
    Note over P,DB: 回合結束 ✅ 成功結算
```

---

## 7.1 資料庫 JSON 格式範例

### 📜 注單記錄 (bet_records)
```json
{
  "betId": "WHACK-20260313-X1Y2Z3",
  "sessionId": "SESS-wH4cK1nG",
  "playerId": "user_888",
  "betAmount": 50.00,
  "emptyHoleCount": 3,
  "rtpSetting": 97,
  "status": "settled",
  "whackedHoles": [0, 5, 10],
  "currentMultiplier": 2.15,
  "serverSeedHash": "b3f9c1e2b84d...",
  "createdAt": "2026-03-13T12:00:00.000Z",
  "updatedAt": "2026-03-13T12:05:30.000Z"
}
```

---

## 8. RTP 賠率倍率對照表 (範例: 3 個空洞)

> 以下為空洞數量 = 3 的情境（網格 16 洞），分別在不同 RTP 設定下成功敲中 d 個地鼠後的累積倍率。

| 敲中地鼠數 (d) | 公平倍率 (100%) | RTP 99% | RTP 98% | RTP 97% | RTP 96% | RTP 94% |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 1.231x | 1.218x | 1.206x | 1.194x | 1.181x | 1.157x |
| 2 | 1.538x | 1.523x | 1.507x | 1.492x | 1.477x | 1.446x |
| 3 | 1.956x | 1.936x | 1.917x | 1.897x | 1.878x | 1.838x |
| 4 | 2.533x | 2.508x | 2.482x | 2.457x | 2.432x | 2.381x |
| 5 | 3.355x | 3.321x | 3.288x | 3.254x | 3.221x | 3.153x |
| 6 | 4.568x | 4.522x | 4.476x | 4.431x | 4.385x | 4.294x |

---

## 9. 市場研究總結
根據對市場上如 Jili Games 或 Dream Tech 的打地鼠遊戲研究：
- **Jili Whack-A-Mole**：偏向射擊/連續點擊型，具備累積大獎 (Jackpot) 機制。
- **Dream Tech Whack-A-Mole**： slot 類型，5x3 結構，RTP 為 97%。
- **本專案差異化**：採用 Pick-to-Win 機制，更具策略性（玩家決定何時停手），且具備最高 99% 的高透明度 RTP，適合追求公平性的玩家。
