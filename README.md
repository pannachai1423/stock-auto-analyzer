# Stock Auto Analyzer

เว็บแอปวิเคราะห์หุ้นอัตโนมัติด้วย Next.js, TypeScript, Tailwind CSS, Yahoo Finance และ TradingView Lightweight Charts

## ฟีเจอร์

- ค้นหาหุ้นสหรัฐด้วย ticker เช่น `AAPL`, `MSFT`, `NVDA`, `TSLA`, `AMD`, `META`, `PLTR`
- ดึงราคาปัจจุบัน, open, high, low, previous close, volume, average volume, market cap, 52 week high/low จาก Yahoo Finance
- ดึง options chain พร้อม call/put volume, open interest และ top contracts
- คำนวณแนวรับ/แนวต้านจาก Pivot Points, previous high/low, swing high/low, MA 20/50/100/200, volume profile, Fibonacci และข้อมูลย้อนหลัง 3 เดือน, 6 เดือน, 1 ปี
- วิเคราะห์ trend จาก EMA 20/50/200, RSI 14, MACD, Bollinger Bands, ADX, volume spike และตำแหน่งราคากับ moving averages
- Stock Score 0-100 พร้อมสัญญาณ `Buy`, `Sell`, `Watch`
- หน้า `หุ้นมาแรง` สำหรับ most active, gainers, losers, high relative volume และ options ranking
- หน้า `Options Activity`
- Watchlist ส่วนตัว เก็บใน browser localStorage
- Alerts สำหรับ price, RSI และ relative volume
- AI Summary ภาษาไทยแบบ rule-based ไม่ต้องใช้ API key
- Compare page สำหรับเทียบหลายหุ้นพร้อม market breadth
- Backtest สัญญาณ EMA 20/50 แบบง่าย
- Risk/Reward Calculator
- Export CSV และ Print/Save as PDF
- News Sentiment จาก Yahoo Finance search endpoint
- Portfolio Tracker สำหรับหุ้นที่ถือ
- Trade Journal สำหรับบันทึกแผน/เหตุผลซื้อขาย
- ATR 14, VWAP 20D, Supertrend, Weekly/Monthly trend
- Gap Scanner, Pattern Detection และ Breakout Scanner
- Relative Strength เทียบ QQQ
- Scenario Planner
- Theme toggle และ language preference แบบ localStorage
- กราฟ candlestick, volume, EMA, support/resistance, RSI และ MACD
- In-memory cache เพื่อลดการเรียก Yahoo Finance ถี่เกินไป
- Auto refresh ทุก 15, 30 หรือ 60 วินาที

## ข้อจำกัดสำคัญ

ข้อมูลมาจาก Yahoo Finance ซึ่งบางตลาดอาจเป็น real-time และบางตลาดอาจ delayed ตามสิทธิ์ข้อมูลของ Yahoo Finance แอปจึงแสดง timestamp ล่าสุดเสมอและไม่เคลมว่า real-time 100%

ผลวิเคราะห์ทั้งหมดไม่ใช่คำแนะนำการลงทุน ผู้ใช้ควรตรวจสอบข้อมูลและความเสี่ยงด้วยตนเองก่อนตัดสินใจ

## ติดตั้ง

ต้องมี Node.js 20 ขึ้นไป และ npm/pnpm/yarn

```bash
npm install
npm run dev
```

เปิดเว็บที่:

```text
http://localhost:3000
```

## คำสั่งที่ใช้บ่อย

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Environment Variables

ไม่จำเป็นต้องตั้งค่า API key สำหรับ Yahoo Finance ผ่าน `yahoo-finance2`

ปรับ cache TTL ได้:

```bash
STOCK_CACHE_MS=30000
RANKING_CACHE_MS=60000
```

## โครงสร้างโปรเจกต์

```text
app/
  api/stock/[symbol]/route.ts   API วิเคราะห์หุ้นรายตัว
  api/rankings/route.ts         API ranking หุ้นมาแรงและ options
  page.tsx                      Dashboard
  rankings/page.tsx             หน้า ranking
  options/page.tsx              หน้า options activity
  compare/page.tsx              หน้าเปรียบเทียบหุ้น
components/
  StockDashboard.tsx            UI หลัก
  AdvancedTools.tsx             watchlist, alerts, summary, backtest, risk, export, news
  CompareDashboard.tsx          UI เปรียบเทียบหุ้น
  PriceChart.tsx                Lightweight Charts
  RankingTables.tsx             ตาราง ranking
lib/
  yahoo.ts                      Yahoo Finance data layer + cache wrapper
  advanced.ts                   summary, backtest, CSV helpers
  analysis.ts                   indicators, support/resistance, score
  math.ts                       EMA, SMA, RSI, MACD, Bollinger, ADX
  cache.ts                      in-memory cache
  types.ts                      shared types
```

## Deploy

### Vercel

1. Push โปรเจกต์ขึ้น GitHub
2. Import repository ใน Vercel
3. Framework preset เป็น Next.js
4. Build command: `npm run build`
5. Output ใช้ค่า default ของ Next.js
6. ตั้ง environment variables ถ้าต้องการปรับ cache TTL
7. Deploy

### Docker

สร้าง Dockerfile เพิ่มได้ตามนี้:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
```

จากนั้นรัน:

```bash
docker build -t stock-auto-analyzer .
docker run -p 3000:3000 stock-auto-analyzer
```

## Production Notes

- In-memory cache เหมาะกับ single instance หาก deploy หลาย instance ควรเปลี่ยน `lib/cache.ts` เป็น Redis
- Yahoo Finance อาจ rate limit หรือเปลี่ยน response shape ได้ ควรมี monitoring สำหรับ API errors
- Most Active Options แบบ global ไม่มี endpoint เดียวที่ Yahoo Finance เปิดให้เสถียรในแพ็กเกจนี้ แอปจึงคำนวณจาก watchlist หุ้นยอดนิยมและ options chain ที่ดึงได้
- หากหุ้นไม่มี options chain แอปจะแสดง `ไม่มีข้อมูล options` โดยไม่เดาข้อมูล
