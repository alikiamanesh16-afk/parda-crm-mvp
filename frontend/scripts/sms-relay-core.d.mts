// Types for the .mjs SMS relay core (imported from vite.config.ts).
export interface SendResult {
  status: number;
  body: string;
  ws?: string;
}
export declare function sendSmsViaSession(
  to: string,
  text: string,
): Promise<SendResult>;
