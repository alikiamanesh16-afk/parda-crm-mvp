# ─── لایه‌ی دسترسی به دیتابیس پردا ─────────────────────────────────────────────
# دو حالت:
#   mock_mode=True  → دیتای نمونه (قبل از رسیدن API واقعی)
#   mock_mode=False → httpx به API دیتابیس وصل می‌شود
#
# وقتی تیم دیتابیس آدرس و کلید داد، فقط .env را پر کنید — این فایل تغییر نمی‌کند.

from typing import Optional
import httpx

from config import settings
from models import Contact, ContactDetail, CrmEvent, MessagesResponse, UpdatesResponse

# ─── دیتای نمونه (Mock) ───────────────────────────────────────────────────────

_MOCK_CONTACTS: list[Contact] = [
    Contact(
        contact_id="3",
        ig_username="poshakdovlat",
        shop_name="tolidipooshakdovlat",
        phone="+989171234567",
        page_connected=True,
        page_connected_at="2026-10-15 14:42",
        funnel_stage="S4",
        funnel_stage_label="demand, no paid order in 7 days",
        first_contact_at="2026-10-17 17:00",
        last_contact_at="2026-11-22 16:55",
        message_count=620,
        history_summary=(
            "2026-11-22 16:55 — درباره سفارش ۱۵ آبان پیگیر شدیم\n"
            "2026-11-21 20:07 — پیامک ورود فرستادیم"
        ),
        overall_summary=(
            "• فروشنده پیج پوشاک «پوشاک دولت» است و از ۲۰۲۶-۱۰-۱۷ در پردا آمده\n"
            "• یک سفارش پرداخت‌شده در انتظار ارسال دارد\n"
            "• درخواست انتقال خریدهای پنل قبلی را پیگیری می‌کند"
        ),
        open_issues=(
            "– سفارش ۱۵ آبان هنوز ارسال نشده\n"
            "– انتقال سفارش‌های پنل قبلی بی‌پاسخ است"
        ),
        summary_generated_at="2026-11-22T17:00:00+03:30",
    ),
    Contact(
        contact_id="9",
        ig_username="hani.gallery.bnd",
        shop_name="هانی گالری بندرعباس",
        phone="+989171234599",
        page_connected=True,
        funnel_stage="S6",
        first_contact_at="2026-10-20 09:00",
        last_contact_at="2026-11-23 10:00",
        message_count=662,
        overall_summary="• فروشنده فعال با فروش مکرر",
        open_issues="",
        summary_generated_at="2026-11-23T10:00:00+03:30",
    ),
]

_MOCK_EVENTS: dict[str, list[CrmEvent]] = {
    "3": [
        CrmEvent(event_id="1", at="2026-10-13 11:22", event_type="signed_up", detail="ثبت‌نام در پردا"),
        CrmEvent(event_id="12", at="2026-10-15 14:42", event_type="page_connected", detail="اتصال پیج"),
        CrmEvent(event_id="40", at="2026-11-06 21:01", event_type="order_paid",
                 detail="سفارش SC-269BBS", amount_toman=2999000, gateway=None),
    ],
    "9": [
        CrmEvent(event_id="100", at="2026-11-20 15:48", event_type="order_paid",
                 detail="سفارش SC-270AAA", amount_toman=4500000, gateway=None),
    ],
}

_MOCK_MESSAGES: dict[str, list[dict]] = {
    "3": [
        {"message_id": "152", "at": "2026-10-17 17:00", "direction": "inbound",
         "sender": "seller", "channel": "instagram_dm_web", "text": "سلام", "media_url": None},
        {"message_id": "153", "at": "2026-10-17 17:01", "direction": "inbound",
         "sender": "seller", "channel": "instagram_dm_web", "text": "[media]", "media_url": None},
    ],
    "9": [
        {"message_id": "900", "at": "2026-11-23 09:00", "direction": "outbound",
         "sender": "us", "channel": "instagram_dm", "text": "پیگیر سفارش شما هستیم", "media_url": None},
    ],
}

# ─── کلاینت دیتابیس ───────────────────────────────────────────────────────────


class PardaDBClient:
    """اتصال به API دیتابیس پردا."""

    def __init__(self) -> None:
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=settings.parda_api_base_url,
                headers={"X-API-Key": settings.parda_api_key},
                timeout=settings.parda_api_timeout,
            )
        return self._client

    def _check_ready(self) -> None:
        if not settings.parda_api_base_url or settings.mock_mode:
            raise RuntimeError("MOCK")  # فراخوان باید MOCK را هندل کند

    async def get_contacts(self) -> list[Contact]:
        if settings.mock_mode:
            return _MOCK_CONTACTS
        self._check_ready()
        r = await self.client.get("/contacts")
        r.raise_for_status()
        return [Contact.model_validate(x) for x in r.json()["items"]]

    async def get_contact(self, contact_id: str) -> Optional[ContactDetail]:
        if settings.mock_mode:
            if contact_id not in _MOCK_EVENTS:
                return None
            contact = next((c for c in _MOCK_CONTACTS if c.contact_id == contact_id), None)
            if not contact:
                return None
            return ContactDetail(contact=contact, events=_MOCK_EVENTS[contact_id])
        self._check_ready()
        r = await self.client.get(f"/contacts/{contact_id}")
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return ContactDetail.model_validate(r.json())

    async def get_messages(self, contact_id: str, cursor: Optional[str] = None) -> MessagesResponse:
        if settings.mock_mode:
            raw = _MOCK_MESSAGES.get(contact_id, [])
            return MessagesResponse(items=[__import__("models").Message.model_validate(m) for m in raw])
        self._check_ready()
        params = {"cursor": cursor} if cursor else None
        r = await self.client.get(f"/contacts/{contact_id}/messages", params=params)
        r.raise_for_status()
        return MessagesResponse.model_validate(r.json())

    async def get_updates(self, since: str) -> UpdatesResponse:
        if settings.mock_mode:
            from datetime import datetime, timedelta, timezone
            server_now = datetime.now(timezone(timedelta(hours=3, minutes=30)))
            return UpdatesResponse(
                contacts=[c.contact_id for c in _MOCK_CONTACTS],
                server_time=server_now.strftime("%Y-%m-%dT%H:%M:%S+03:30"),
            )
        self._check_ready()
        r = await self.client.get("/updates", params={"since": since})
        r.raise_for_status()
        return UpdatesResponse.model_validate(r.json())


db = PardaDBClient()
