/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_SECRET: string;
  RESEND_API_KEY?: string;
  // Asaas (cobrança Pix) — configurar no Cloudflare, NUNCA no código
  ASAAS_API_KEY?: string;
  ASAAS_BASE_URL?: string;        // default: https://api.asaas.com/v3 (produção)
  ASAAS_VALOR_VISION?: string;    // default: 97
}
