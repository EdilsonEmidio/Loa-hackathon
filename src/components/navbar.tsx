"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/actions/auth-actions";
import {
  GraduationCap,
  School,
  FileSpreadsheet,
  ShieldCheck,
  Bell,
  LogOut,
  Boxes,
  ClipboardList,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import type { UserSession } from "@/lib/session";
import type { AlertaItem } from "@/lib/alertas";

interface NavbarProps {
  session: UserSession;
  alertas: AlertaItem[];
  escolasLista?: { id: number; nome: string }[];
  idEscolaSelecionada?: number;
}

export function Navbar({
  session,
  alertas,
  escolasLista = [],
  idEscolaSelecionada,
}: NavbarProps) {
  const pathname = usePathname();
  const [dropdownAlertasAberto, setDropdownAlertasAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = session.papel === "administrador";
  const isSecretaria = session.papel === "secretaria";
  const isEscola = session.papel === "escola";

  const totalAlertas = alertas.length;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAlertasAberto(false);
      }
    }
    if (dropdownAlertasAberto) {
      document.addEventListener("mousedown", handleClickFora);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, [dropdownAlertasAberto]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo e Nome em destaque */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">
                Secretaria de Educação
              </span>
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block">
                Gestão & Estoque Escolar
              </span>
            </div>
          </Link>

          {/* Navegação Principal com Itens Maiores */}
          <nav className="hidden lg:flex items-center gap-2">
            {/* Links da Escola */}
            {(isEscola || isAdmin) && (
              <>
                <Link
                  href="/escola"
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    pathname === "/escola" || pathname.startsWith("/escola/pedidos")
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>Pedidos da Escola</span>
                </Link>

                <Link
                  href="/escola/estoque"
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    pathname === "/escola/estoque"
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Boxes className="w-5 h-5" />
                  <span>Estoque da Escola</span>
                </Link>
              </>
            )}

            {/* Separador se for Admin */}
            {isAdmin && <div className="h-7 w-px bg-slate-200 mx-1.5" />}

            {/* Links da Secretaria */}
            {(isSecretaria || isAdmin) && (
              <>
                <Link
                  href="/secretaria"
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    pathname === "/secretaria"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Painel Secretaria</span>
                </Link>

                <Link
                  href="/secretaria/estoque"
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    pathname === "/secretaria/estoque"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Boxes className="w-5 h-5" />
                  <span>Estoque das Escolas</span>
                </Link>
              </>
            )}

            {/* Link Admin */}
            {isAdmin && (
              <>
                <div className="h-7 w-px bg-slate-200 mx-1.5" />
                <Link
                  href="/admin"
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    pathname.startsWith("/admin")
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Admin Geral</span>
                </Link>
              </>
            )}
          </nav>

          {/* Lado Direito: Sininho e Perfil */}
          <div className="flex items-center gap-3.5">
            {/* Botão de Alertas com Dropdown Exatamente Embaixo do Sininho */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownAlertasAberto(!dropdownAlertasAberto)}
                className={`relative p-2.5 rounded-xl transition-all cursor-pointer border ${
                  dropdownAlertasAberto
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
                }`}
                title="Avisos de Estoque e Validade"
                aria-expanded={dropdownAlertasAberto}
              >
                <Bell className="w-6 h-6" />
                {totalAlertas > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white shadow-md animate-pulse">
                    {totalAlertas}
                  </span>
                )}
              </button>

              {/* Dropdown posicionado abaixo do sininho */}
              {dropdownAlertasAberto && (
                <div className="absolute right-0 top-full mt-2.5 w-[360px] sm:w-[440px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Cabeçalho do Dropdown */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Avisos de Estoque & Validade
                        </h3>
                        <p className="text-xs text-slate-500">
                          {totalAlertas === 0
                            ? "Nenhum alerta crítico no momento"
                            : `${totalAlertas} item(ns) exigem atenção`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDropdownAlertasAberto(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lista de Alertas com Scroll Interno */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-2">
                    {totalAlertas === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Todos os estoques e prazos de validade estão em níveis regulares.
                      </div>
                    ) : (
                      alertas.map((alerta, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl hover:bg-slate-50 transition flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  alerta.tipo === "estoque_baixo"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {alerta.tipo === "estoque_baixo"
                                  ? "Estoque Baixo"
                                  : "Vence em Breve"}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {alerta.nomeEscola}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900">
                              {alerta.nomeProduto}
                            </p>
                            <p className="text-[11px] text-slate-500">{alerta.detalhe}</p>
                          </div>

                          {(isEscola || isAdmin) && (
                            <Link
                              href="/escola/pedidos/novo"
                              onClick={() => setDropdownAlertasAberto(false)}
                              className="shrink-0 text-xs flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition"
                            >
                              <span>Pedir</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Rodapé do Dropdown */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-400 text-[11px]">Atualizado em tempo real</span>
                    <button
                      type="button"
                      onClick={() => setDropdownAlertasAberto(false)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 transition cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info do Usuário */}
            <div className="hidden sm:flex flex-col text-right border-l border-slate-200 pl-3.5">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {session.nome}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isEscola && session.nomeEscola ? (
                  <span className="text-emerald-600 font-semibold">{session.nomeEscola}</span>
                ) : (
                  <span className="capitalize">{session.papel}</span>
                )}
              </span>
            </div>

            {/* Logout */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all cursor-pointer"
                title="Encerrar sessão"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
