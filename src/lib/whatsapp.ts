export function limparFone(fone: string): string {
  return fone.replace(/\D/g, '');
}

export function whatsappLink(fone: string, mensagem: string): string {
  const numero = limparFone(fone);
  const numBR = numero.startsWith('55') ? numero : `55${numero}`;
  return `https://wa.me/${numBR}?text=${encodeURIComponent(mensagem)}`;
}

export function aplicarVariaveis(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export function foneValido(fone?: string | null): boolean {
  if (!fone) return false;
  return limparFone(fone).length >= 10;
}
