import {
  LayoutDashboard, Users, Wrench, ShoppingCart, Target, BarChart3, Banknote, Receipt, ArrowUpFromLine, ArrowDownToLine,
  FileText, TrendingUp, Landmark, Building2, Megaphone, Cake, MessageSquare, History, Factory, Stethoscope, Package,
  Boxes, Trophy, Store, UserCog, Settings, Search, Sun, Moon, LogOut, Lock, CheckCircle2, Clock, Glasses, Wallet,
  Vault, ShoppingBag, CircleDollarSign, Handshake, Microscope, ClipboardList, Pin, Eye, X, ScanLine, Repeat,
  AlertTriangle, Phone, MapPin, Printer, Smartphone, Award, Star, UserPlus, RefreshCw, Medal, CreditCard, Send,
  Building, Inbox, Pencil, Trash2, Plus, Sparkles, Shield, Menu, Keyboard, ArrowRight, Save, RotateCcw, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  MessageCircle, Camera, User, Map as MapIcon, Ban, FolderOpen, Info, Minus, ClipboardCheck, ArrowLeftRight, FolderTree, PackagePlus, type LucideIcon,
} from 'lucide-react';

// Ícones de linha (SVG) usados no lugar de emojis. Herdam a cor do texto.
const MAPA = {
  painel: LayoutDashboard, clientes: Users, os: Wrench, vendas: ShoppingCart, crm: Target, relatorios: BarChart3,
  caixa: Banknote, faturamento: Receipt, pagar: ArrowUpFromLine, receber: ArrowDownToLine, carne: FileText,
  fluxo: TrendingUp, contas: Landmark, bancario: Building2, campanhas: Megaphone, aniversario: Cake,
  modelos: MessageSquare, historico: History, fornecedores: Factory, medicos: Stethoscope, produtos: Package,
  estoque: Boxes, ranking: Trophy, lojas: Store, usuarios: UserCog, config: Settings, busca: Search,
  sol: Sun, lua: Moon, sair: LogOut, cadeado: Lock, ok: CheckCircle2, relogio: Clock, oculos: Glasses,
  carteira: Wallet, cofre: Vault, sacola: ShoppingBag, dinheiro: CircleDollarSign, parceria: Handshake,
  laboratorio: Microscope, lista: ClipboardList, pin: Pin, olho: Eye, fechar: X, leitor: ScanLine, repetir: Repeat,
  alerta: AlertTriangle, telefone: Phone, local: MapPin, imprimir: Printer, celular: Smartphone, premio: Award,
  estrela: Star, novo: UserPlus, reativar: RefreshCw, medalha: Medal, cartao: CreditCard, enviar: Send,
  empresa: Building, caixaEntrada: Inbox, editar: Pencil, excluir: Trash2, mais: Plus, destaque: Sparkles, escudo: Shield,
  menu: Menu, teclado: Keyboard, seta: ArrowRight, salvar: Save, desfazer: RotateCcw,
  primeiro: ChevronsLeft, anterior: ChevronLeft, proximo: ChevronRight, ultimo: ChevronsRight,
  whatsapp: MessageCircle, camera: Camera, usuario: User, mapa: MapIcon, bloqueio: Ban, abrir: FolderOpen, info: Info,
  menos: Minus, contar: ClipboardCheck, mover: ArrowLeftRight, categorias: FolderTree, repor: PackagePlus,
} satisfies Record<string, LucideIcon>;

export type NomeIcone = keyof typeof MAPA;

export default function Icone({ nome, size = 16, color, strokeWidth = 1.8, style }: { nome: NomeIcone | string; size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties }) {
  const C = (MAPA as Record<string, LucideIcon>)[nome];
  if (!C) return null;
  return <C size={size} color={color} strokeWidth={strokeWidth} style={{ flexShrink: 0, ...style }} aria-hidden />;
}
