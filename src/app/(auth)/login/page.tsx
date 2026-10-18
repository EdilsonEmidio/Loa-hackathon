"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/actions/auth-actions";
import { LogIn, GraduationCap, School, ShieldCheck, FileSpreadsheet, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const [emailInput, setEmailInput] = useState("");
  const [senhaInput, setSenhaInput] = useState("");

  const handleQuickLogin = (email: string) => {
    setEmailInput(email);
    setSenhaInput("123456");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background suave */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Secretaria de Educação
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Sistema Integrado de Pedidos e Gestão de Estoque Escolar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-3 text-red-700 text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail institucional
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="usuario@educacao.gov.br"
                  className="block w-full rounded-xl bg-white border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl bg-white border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acessar o Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login para Demonstração do Hackathon */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
              Perfis de Acesso Rápido (Demonstração)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@educacao.gov.br")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-left transition-all group"
              >
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800">Administrador</p>
                  <p className="text-[11px] text-slate-500 truncate">Acesso Geral</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("secretaria@educacao.gov.br")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-left transition-all group"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-200">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800">Secretaria</p>
                  <p className="text-[11px] text-slate-500 truncate">Gestão & Relatórios</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("escola.monteiro@educacao.gov.br")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-left transition-all group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200">
                  <School className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800">E.M. Monteiro</p>
                  <p className="text-[11px] text-slate-500 truncate">Unidade Escolar 1</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("escola.cecilia@educacao.gov.br")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-left transition-all group"
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-200">
                  <School className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800">E.M. Cecília</p>
                  <p className="text-[11px] text-slate-500 truncate">Unidade Escolar 2</p>
                </div>
              </button>
            </div>
            <p className="text-xs text-center text-slate-500 mt-3 font-medium">
              Senha padrão para todos os testes: <span className="text-slate-800 font-mono font-bold">123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
