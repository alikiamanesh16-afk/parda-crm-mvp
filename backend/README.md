# پردا CRM — بک‌اند پایتون (FastAPI)

بک‌اند اتصال CRM به دیتابیس پردا. **الان در حالت MOCK است** — دیتای نمونه می‌دهد؛
وقتی تیم دیتابیس آدرس و کلید داد، فقط `.env` پر می‌شود و واقعی می‌شود. هیچ کد دیگری تغییر نمی‌کند.

## اجرا

```bash
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

- مستندات تعاملی (Swagger): **http://localhost:8000/docs**
- وضعیت: **http://localhost:8000/health**

## اتصال به دیتابیس واقعی (وقتی آدرس دادن)

1. `.env.example` را کپی کن به `.env`
2. این سه خط را پر کن:
   ```
   PARDA_API_BASE_URL=https://...
   PARDA_API_KEY=کلید-اختصاصی
   MOCK_MODE=False
   ```
3. سرور را ری‌استارت کن — تمام.

## Endpoints (قرارداد کامل: ../parda-crm/DATABASE_REQUIREMENTS.md)

| متد | مسیر | کار |
|---|---|---|
| GET | `/api/contacts` | لیست غرفه‌داران |
| GET | `/api/contacts/{id}` | جزئیات + رویدادها |
| GET | `/api/contacts/{id}/messages` | کل دایرکت اینستاگرام |
| GET | `/api/updates?since=` | تغییرات بعد از یک زمان (polling) |
| POST | `/api/sms/send` | ارسال پیامک (فعلاً ثبت؛ ارسال واقعی بعداً) |
| POST | `/api/webhook/events` | گیرنده وب‌هوک دیتابیس (فاز ۳) |
| GET | `/health` | وضعیت سرور |

احراز هویت: هدر `X-API-Key: <CRM_API_KEY>` روی همه‌ی endpoint های `/api/*` (وب‌هوک جدا با `X-Webhook-Secret`).

## اتصال فرانت به این بک‌اند

در `parda-crm/.env` (فرانت) یا مستقیم در `src/config.ts`:
```
VITE_API_BASE=http://localhost:8000
VITE_API_KEY=dev-crm-key
```
و `ApiSource` به‌جای `CsvSource` فعال می‌شود (فایل `src/data/DataSource.ts`).

## فایل‌ها

| فایل | کار |
|---|---|
| `main.py` | سرور FastAPI و endpoint ها |
| `parda_db.py` | لایه دیتابیس: MOCK یا httpx واقعی |
| `models.py` | مدل‌های دیتا (قرارداد با فرانت) |
| `config.py` | خواندن `.env` |
