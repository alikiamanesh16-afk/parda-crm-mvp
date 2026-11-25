# ─── مدل‌های دیتا — دقیقاً همان قرارداد DATABASE_REQUIREMENTS.md ───────────────
# این مدل‌ها بین بک‌اند و فرانت مشترک‌اند؛ تغییرشان یعنی تغییر قرارداد.

from typing import Optional, Literal
from pydantic import BaseModel

Direction = Literal["inbound", "outbound"]
EventType = Literal[
    "signed_up",
    "page_connected",
    "stage_changed",
    "order_paid",
    "payout_requested",
    "payout_paid",
]


class Contact(BaseModel):
    contact_id: str
    ig_username: str = ""
    shop_name: str = ""
    phone: str = ""                          # کامل، بدون ماسک
    page_connected: bool = False
    page_connected_at: Optional[str] = None  # 'YYYY-MM-DD HH:MM' به وقت ایران
    funnel_stage: str = ""                   # S1..S6 (داخلی؛ UI تبدیل می‌کند)
    funnel_stage_label: str = ""
    funnel_stage_at: Optional[str] = None
    first_contact_at: Optional[str] = None
    last_contact_at: Optional[str] = None
    message_count: int = 0
    history_summary: str = ""                # خطوط 'YYYY-MM-DD HH:MM — متن'
    overall_summary: str = ""                # بولت‌های '• ...'
    open_issues: str = ""                    # خطوط '– ...'
    summary_generated_at: Optional[str] = None
    assignee: Optional[str] = None           # مسئول حساب (مدیریت تیم CRM)


class Message(BaseModel):
    message_id: str
    at: str
    direction: Direction
    sender: str = "seller"
    channel: str = "instagram_dm"
    text: str = ""
    media_url: Optional[str] = None          # لینک مستقیم عکس/فیلم/ویس


class CrmEvent(BaseModel):
    event_id: str
    at: str
    event_type: EventType
    detail: str = ""
    amount_toman: Optional[int] = None
    gateway: Optional[str] = None            # zarinpal / salampay / digipay / ...


class ContactDetail(BaseModel):
    contact: Contact
    events: list[CrmEvent] = []


class MessagesResponse(BaseModel):
    items: list[Message]
    next_cursor: Optional[str] = None        # اگر صفحه‌بندی داشتیم


class UpdatesResponse(BaseModel):
    contacts: list[str]                      # contact_id هایی که تغییر کرده‌اند
    server_time: str


class SendSmsRequest(BaseModel):
    to: str                                  # شماره کامل
    text: str


class SendSmsResponse(BaseModel):
    ok: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
