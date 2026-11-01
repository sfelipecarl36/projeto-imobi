
import { useState, type FormEvent } from "react";
import { House, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  async function handleCadastro(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro(false);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome },
        },
      });

      if (error) throw error;

      setMensagem(
        "Cadastro solicitado! Verifique seu e-mail para confirmar sua conta."
      );
    } catch (error) {
      setErro(true);
      setMensagem(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao cadastrar."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full rounded-xl bg-gray-50 px-4 py-4 text-sm outline-none border border-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition";

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-sm">

        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            {/* Subs pela logo futuramente */}
            <House size={30} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              muda aí<span className="text-green-600">.</span>
            </h1>
            <p className="text-xs text-gray-500">
              Seu próximo lar começa aqui.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">
            Encontre seu lugar no mundo.
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Crie sua conta e descubra um jeito mais simples
            de alugar seu próximo lar.
          </p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-5">

          <div>
            <label htmlFor="nome" className="mb-2 block text-sm font-semibold">
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como podemos te chamar?"
              autoComplete="name"
              required
              className={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
              className={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-2 block text-sm font-semibold">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
              className={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar minha conta"}
            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        {mensagem && (
          <p
            role="status"
            className={`mt-5 text-center text-sm ${
              erro ? "text-red-600" : "text-green-700"
            }`}
          >
            {mensagem}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Já tem uma conta?{" "}
          <Link
            to="/login"
            className="font-semibold text-green-600"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
