// Gerador de "Pix Copia e Cola" (BR Code / EMV) estático com valor.
// Não depende de banco/gateway: o pagamento cai direto na chave Pix informada.

function tlv(id: string, valor: string): string {
  const len = valor.length.toString().padStart(2, '0');
  return `${id}${len}${valor}`;
}

// CRC16-CCITT (polinômio 0x1021, init 0xFFFF): exigido pelo padrão Pix
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function limpa(s: string, max: number): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // tira acentos
    .replace(/[^A-Za-z0-9 ]/g, '')                    // só alfanumérico e espaço
    .trim().toUpperCase().slice(0, max);
}

function limpaTxid(s: string): string {
  const t = (s || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
  return t || '***';
}

function cpfValido(c: string): boolean {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (n: number) => { let soma = 0; for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i); return (soma * 10) % 11 % 10; };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

// Deixa a chave no formato que os bancos exigem no QR Code:
// telefone = +55DDDNUMERO, CPF/CNPJ = só números, e-mail = minúsculo, aleatória = como está.
// Ex.: "85986596927" não é CPF válido e é celular → "+5585986596927" (sem o +55 o banco lê como CPF e recusa).
export function normalizarChavePix(bruta: string): { chave: string; tipo: 'email' | 'telefone' | 'cpf' | 'cnpj' | 'aleatoria' | 'invalida' } {
  const t = (bruta || '').trim();
  if (!t) return { chave: '', tipo: 'invalida' };
  if (t.includes('@')) return { chave: t.toLowerCase(), tipo: 'email' };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) return { chave: t.toLowerCase(), tipo: 'aleatoria' };
  const d = t.replace(/\D/g, '');
  if (t.startsWith('+')) return { chave: '+' + d, tipo: 'telefone' };
  if (d.length === 14) return { chave: d, tipo: 'cnpj' };
  if (d.length === 11 && cpfValido(d)) return { chave: d, tipo: 'cpf' };
  if (d.length === 11 || d.length === 10) return { chave: '+55' + d, tipo: 'telefone' };          // DDD + número
  if ((d.length === 13 || d.length === 12) && d.startsWith('55')) return { chave: '+' + d, tipo: 'telefone' };
  return { chave: t, tipo: 'invalida' };
}

export interface PixParams {
  chave: string;        // chave Pix (cpf/cnpj/email/telefone/aleatória)
  nome: string;         // nome do recebedor (máx 25)
  cidade: string;       // cidade do recebedor (máx 15)
  valor: number;        // valor em reais
  txid?: string;        // identificador (máx 25 alfanum): ex: nº do carnê/parcela
  descricao?: string;   // não vai mais no QR (compatibilidade com os apps de banco)
}

// Monta o "copia e cola" do Pix
export function montarPixBRCode(p: PixParams): string {
  const chave = normalizarChavePix(p.chave).chave;
  const nome = limpa(p.nome, 25) || 'RECEBEDOR';
  const cidade = limpa(p.cidade, 15) || 'CIDADE';
  const valor = (Math.round((p.valor || 0) * 100) / 100).toFixed(2);
  const txid = limpaTxid(p.txid || '');

  // Merchant Account Information (ID 26): GUI + chave (+ descrição opcional)
  const mai = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave);

  let payload =
    tlv('00', '01') +             // Payload Format Indicator
    tlv('26', mai) +              // Merchant Account Information (Pix)
    tlv('52', '0000') +           // Merchant Category Code
    tlv('53', '986') +            // Moeda: BRL
    tlv('54', valor) +            // Valor
    tlv('58', 'BR') +             // País
    tlv('59', nome) +             // Nome do recebedor
    tlv('60', cidade) +           // Cidade
    tlv('62', tlv('05', txid));   // Additional Data (txid)

  payload += '6304';             // ID + len do CRC
  return payload + crc16(payload);
}
