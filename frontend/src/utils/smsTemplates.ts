// ─── SMS quick-reply templates (placeholder names — user will replace later) ──
export interface SmsTemplate {
  id: string;
  title: string; // short label shown in the picker
  body: string; // actual message text; {shop} placeholder = seller/shop name
}

export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'tpl_test_1',
    title: 'خوش‌آمد (تستی ۱)',
    body: '{shop} عزیز سلام 👋\nبه پردا خوش اومدی. هر سوالی داشتی در خدمتیم.',
  },
  {
    id: 'tpl_test_2',
    title: 'پیگیری سفارش (تستی ۲)',
    body: '{shop} عزیز سلام\nسفارش شما در حال بررسیه و به‌زودی بهت اطلاع میدیم.',
  },
  {
    id: 'tpl_test_3',
    title: 'یادآوری خرید نیمه‌کاره (تستی ۳)',
    body: '{shop} عزیز سلام\nسبد خریدت هنوز منتشرته! برای ادامه از لینک زیر استفاده کن.',
  },
  {
    id: 'tpl_test_4',
    title: 'اطلاع‌رسانی تسویه (تستی ۴)',
    body: '{shop} عزیز سلام\nتسویه‌ی شما ثبت شد و به‌زودی واریز میشه.',
  },
  {
    id: 'tpl_test_5',
    title: 'دعوت به اتصال پیج (تستی ۵)',
    body: '{shop} عزیز سلام\nبرای نمایش محصولاتت در پردا، پیج اینستاگرامت رو وصل کن.',
  },
];
