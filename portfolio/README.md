# securify — Portfolio Hero

เว็บพอร์ตโฟลิโอ ดีไซน์แบบ full-screen hero section ("securify") สร้างด้วย
**React + TypeScript + Tailwind CSS (Vite)**

โฟลเดอร์นี้แยกเก็บไว้ต่างหาก ไม่ปนกับโปรเจกต์อื่น (เช่น stock-auto-analyzer)

## ฟีเจอร์

- พื้นหลังวิดีโอเต็มจอวนลูป (`object-cover`, autoplay/muted/loop)
- Navbar ลอยทรงแคปซูล (pill) — โลโก้ + ลิงก์เมนู + ปุ่ม get started
- ตัวอักษรหัวเรื่องขนาดใหญ่จัดวางแบบ staggered (`protect` / `your` / `data`)
- บล็อกสถิติ 3 มุม พร้อมเส้นแบ่งเอียง และ gradient overlay ด้านล่าง
- พาเลตต์ขาว-ดำล้วน (black / white / neutral-900 + white opacity) รองรับมือถือ

## วิธีรัน

```bash
cd portfolio
npm install
npm run dev      # เปิด http://localhost:5173
```

build สำหรับ production:

```bash
npm run build
npm run preview
```

## โครงสร้าง

```
portfolio/
  index.html              # โหลดฟอนต์ Readex Pro + mount React
  src/
    main.tsx              # entry point
    App.tsx
    index.css            # Tailwind + global styles + .hero-title
    components/Hero.tsx   # hero section + navbar
  tailwind.config.ts
  vite.config.ts
  legacy/Portfolio.html   # เว็บพอร์ตเวอร์ชันเดิม (เก็บไว้อ้างอิง)
```
