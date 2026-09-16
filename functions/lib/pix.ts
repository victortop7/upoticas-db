// Gerador de "Pix Copia e Cola" (BR Code / EMV) estático com valor.
// Não depende de banco/gateway: o pagamento cai direto na chave Pix informada.

function tlv(id: string, valor: string): string {
  const len = valor.length.toString().padStart(2, '0');
  return `${id}${len}${valor}`;
}

// CRC16-CCITT (polinômio 0x1021, init 0xFFFF) — exigido pelo padrão Pix
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

export interface PixParams {
  chave: string;        // chave Pix (cpf/cnpj/email/telefone/aleatória)
  nome: string;         // nome do recebedor (máx 25)
  cidade: string;       // cidade do recebedor (máx 15)
  valor: number;        // valor em reais
  txid?: string;        // identificador (máx 25 alfanum) — ex: nº do carnê/parcela
  descricao?: string;   // descrição curta opcional
}

// Monta o "copia e cola" do Pix
export function montarPixBRCode(p: PixParams): string {
  const chave = (p.chave || '').trim();
  const nome = limpa(p.nome, 25) || 'RECEBEDOR';
  const cidade = limpa(p.cidade, 15) || 'CIDADE';
  const valor = (Math.round((p.valor || 0) * 100) / 100).toFixed(2);
  const txid = limpaTxid(p.txid || '');

  // Merchant Account Information (ID 26): GUI + chave (+ descrição opcional)
  let mai = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave);
  if (p.descricao) {
    const desc = limpa(p.descricao, 40);
    if (desc) mai += tlv('02', desc);
  }

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
