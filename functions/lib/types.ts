/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_SECRET: string;
  RESEND_API_KEY?: string;
}
