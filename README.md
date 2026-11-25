# پردا CRM — MVP

داشبورد CRM برای پیگیری غرفه‌داران پردا: وضعیت قیف فروش، کل گفت‌وگوی اینستاگرام، پیامک، خلاصه تماس و هیستوری مکالمات.

## ساختار پروژه

```
frontend/   ← رابط کاربری (React + TypeScript + Vite)
backend/    ← سرور بک‌اند (Python + FastAPI)
```

## اجرای فرانت

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

راهنمای کامل: [frontend/RUN_LOCALLY.md](frontend/RUN_LOCALLY.md)

> ⚠️ فایل دیتای `parda_crm.csv` توی گیت نیست — از کسی که دیتا داره بگیر و بذار توی `frontend/public/`

## اجرای بک‌اند

```bash
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

- مستندات API: http://localhost:8000/docs
- تا وقتی `.env` پر نشده، بک‌اند در **حالت MOCK** دیتای نمونه می‌دهد

## اتصال به دیتابیس واقعی

1. `backend/.env.example` را کپی کن به `backend/.env`
2. این سه خط را پر کن:
   ```
   PARDA_API_BASE_URL=https://...
   PARDA_API_KEY=***
   MOCK_MODE=False
   ```
3. سرور را ری‌استارت کن — تمام

قرارداد کامل API: [DATABASE_REQUIREMENTS.md](DATABASE_REQUIREMENTS.md)

## مستندات

| فایل | مخاطب |
|---|---|
| `frontend/RUN_LOCALLY.md` | هر کسی که می‌خواد اجرا کنه |
| `DATABASE_REQUIREMENTS.md` | تیم دیتابیس (قرارداد API) |
| `backend/README.md` | راهنمای بک‌اند |
