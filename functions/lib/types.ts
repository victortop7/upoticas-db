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
  // Kommo CRM — integração "lead ganho" → cria cliente + OS/venda
  KOMMO_WEBHOOK_TOKEN?: string;   // token compartilhado com o Kommo (defina o mesmo lá)
  KOMMO_TENANT_EMAIL?: string;    // e-mail de um usuário da ótica p/ resolver o tenant (ex: oticaconceito4@gmail.com)
  // Bling (emissão de NF-e) — app OAuth2 único; tokens ficam por tenant no D1
  BLING_CLIENT_ID?: string;
  BLING_CLIENT_SECRET?: string;
}
