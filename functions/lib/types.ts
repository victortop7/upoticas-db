/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_SECRET: string;
  RESEND_API_KEY?: string;
  // Asaas (cobrança Pix) — configurar no Cloudflare, NUNCA no código
  ASAAS_API_KEY?: string;
  ASAAS_BASE_URL?: string;        // default: https://api.asaas.com/v3 (produção)
  ASAAS_VALOR_VISION?: string;    // default: 97 (plano base, 1 tablet)
  ASAAS_VALOR_DISPOSITIVO?: string; // default: 30 (por tablet extra)
  ASAAS_WEBHOOK_TOKEN?: string;   // token de autenticação do webhook (defina o mesmo no Asaas)
}
