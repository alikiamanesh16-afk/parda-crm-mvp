# ─── پیکربندی بک‌اند پردا ──────────────────────────────────────────────────────
# همه‌ی مقادیر از متغیرهای محیطی (فایل .env) خوانده می‌شوند.
# فقط کافیست .env را بسازید و مقدارها را بدهید — هیچ کد دیگری تغییر نمی‌کند.

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ─── دیتابیس پردا (از تیم دیتابیس پر می‌شود) ───
    # آدرس پایه‌ی API دیتابیس. تا خالی است، بک‌اند در حالت MOCK کار می‌کند.
    parda_api_base_url: str = ""
    parda_api_key: str = ""            # X-API-Key اختصاصی ما
    parda_api_timeout: float = 20.0    # ثانیه

    # ─── امنیت CRM ───
    # کلیدی که خود FastAPI به فرانت می‌دهد (مرورگر در هدر X-API-Key می‌فرستد)
    crm_api_key: str = "dev-crm-key"
    # دامنه‌های مجاز برای CORS — با کاما جدا کنید
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # ─── وب‌هوک (فاز ۳) ───
    webhook_secret: str = ""           # X-Webhook-Secret از دیتابیس

    # ─── شبیه‌سازی ───
    # اگر True باشد، به دیتابیس وصل نمی‌شود و دیتای نمونه برمی‌گرداند.
    mock_mode: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
