// ─── Media message rendering helpers ──────────────────────────────────────────
// The current CSV export has no real media URLs (media messages are just the
// literal placeholder '[media]'). When the API phase delivers real URLs in
// message.text (http(s) links) we render them as real media; placeholder
// messages get a clean, animated media card instead.

export interface MediaInfo {
  kind: 'image' | 'video' | 'audio' | 'voice' | 'file' | 'placeholder';
  url: string;
}

const VOICE_HINT = /(voice|وصیت|سوییس|voic|audio\.ogg|\.oga)/i;

export function detectMedia(text: string): MediaInfo | null {
  const t = (text ?? '').trim();
  if (!t) return null;

  // Real URL case (phase 2 API): http(s) link to a media file
  const urlMatch = t.match(/https?:\/\/\S+/);
  if (urlMatch) {
    const url = urlMatch[0];
    if (/\.(png|jpe?g|gif|webp|avif)(\?\S*)?$/i.test(url)) return { kind: 'image', url };
    if (/\.(mp4|webm|mov|m4v)(\?\S*)?$/i.test(url)) return { kind: 'video', url };
    if (VOICE_HINT.test(url) || /\.(ogg|oga|opus|mp3|wav|m4a)(\?\S*)?$/i.test(url))
      return { kind: 'voice', url };
    return { kind: 'file', url };
  }

  // Placeholder case (current CSV): '[media]' → unknown type card
  if (/^\[media\]$/i.test(t)) return { kind: 'placeholder', url: '' };
  return null;
}

export function isEmojiOnly(text: string): boolean {
  const t = (text ?? '').trim();
  if (!t) return false;
  // strip ZWJ, variation selectors, spaces
  const stripped = t.replace(/[\u200d\ufe0f\s]/g, '');
  if (!stripped) return false;
  // emoji-only: every char is in the extended emoji ranges
  const emojiRe = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]+$/u;
  return emojiRe.test(stripped) && [...stripped].length <= 8;
}
