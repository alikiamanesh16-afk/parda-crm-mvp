# پردا CRM — میز غرفه‌داران (MVP)

داشبورد CRM برای پیگیری غرفه‌داران پردا: وضعیت قیف فروش، کل گفت‌وگوی اینستاگرام، پیامک، خلاصه کلی و هیستوری مکالمات.

## دو بخش پروژه

| پوشه | چی هست | زبان |
|---|---|---|
| `src/` + `public/` | **فرانت** — رابط کاربری | React + TypeScript |
| `backend/` | **بک‌اند** — اتصال به دیتابیس و ارسال پیامک | Python (FastAPI) |

## اجرای فرانت

```bash
npm install
npm run dev        # http://localhost:5173
```

راهنمای کامل: [RUN_LOCALLY.md](RUN_LOCALLY.md)

## اجرای بک‌اند

```bash
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

- مستندات API: http://localhost:8000/docs
- تا وقتی فایل `.env` پر نشده، بک‌اند در **حالت MOCK** دیتای نمونه می‌دهد
- قرارداد کامل API: [DATABASE_REQUIREMENTS.md](DATABASE_REQUIREMENTS.md)

## ساختار

```
src/
├── types.ts            # مدل‌های دامنه (Contact / Message / CrmEvent / ...)
├── config.ts           # ⭐ DATA_SOURCE: 'csv' | 'api'  ← سوئیچ فاز بعد اینجاست
├── data/
│   ├── DataSource.ts   # اینترفیس واحد داده (قرارداد UI)
│   ├── CsvSource.ts    # فاز ۱: خواندن public/parda_crm.csv
│   └── ApiSource.ts    # فاز ۲: همون اینترفیس از API (فعلاً غیرفعال)
├── utils/
│   ├── funnel.ts       # نگاشت مرحله داده → ۴ قدم UI + منطق محصول/فروش
│   └── format.ts       # تاریخ شمسی، مبلغ تومان، اعداد فارسی
└── components/
    ├── Header.tsx        # هدر: مشخصات غرفه‌دار + جستجو (نام/آیدی/فروشگاه/شماره)
    ├── StatusPanel.tsx   # استپر ۴ مرحله‌ای + پرچم اتصال اینستاگرام + بج مرحله CSV
    ├── SummaryPanel.tsx  # خلاصه کلی رابطه
    ├── StatChips.tsx     # آمار: پیام / سفارش / جمع فروش / تسویه
    ├── ChatPanel.tsx     # کل دایرکت از اول تا آخر (حبابی، تفکیک روز)
    ├── HistoryPanel.tsx  # هیستوری: تاریخ/ساعت + خلاصه هر مکالمه
    ├── EventsTimeline.tsx# رویدادها: ثبت‌نام، اتصال، سفارش، تسویه (با مبلغ)
    └── OpenIssues.tsx    # مشکلات باز
```

## سوییچ به API (فاز بعد)

1. `src/config.ts` → `DATA_SOURCE = 'api'` و `API_BASE_URL` را ست کن.
2. اگر مسیر/فیلدهای API با قرارداد `DataSource` فرق دارد، فقط `ApiSource.ts` را ویرایش کن.
3. هیچ کامپوننتی نباید تغییر کند — UI فقط با `DataSource` حرف می‌زند.

قرارداد مورد انتظار API:
- `GET {base}/contacts` → `Contact[]`
- `GET {base}/contacts/:id` → `ContactDetail` (شامل messages / events / history)

## نکته‌های نگاشت داده (شفاف، بدون حدس)

- قیف UI: سرنخ → ثبت‌نام → ساخت اولین محصول → اولین فروش.
  - «سرنخ» = هنوز ثبت‌نام نکرده (در CSV فعلی همه ثبت‌نام کرده‌اند).
  - «اولین محصول» = مرحله داده S3+، یا ذکر «N products» با N≥1 در رویدادها.
  - «اولین فروش» = وجود رویداد `order_paid`.
- پرچم اینستاگرام = ستون `page_connected`.
- تاریخ‌ها شمسی، مبالغ تومان — همه از داده، چیزی تولید نمی‌شود.
