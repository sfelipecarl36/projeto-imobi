
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { House, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;

      navigate("/");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F5] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm">

        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
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
          <h2 className="text-3xl font-bold text-gray-900">
            Bem-vindo de volta!
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Entre na sua conta e continue procurando
            seu próximo lar.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

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
              className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 outline-none focus:border-green-500"
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
              placeholder="Sua senha"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 outline-none focus:border-green-500"
            />
          </div>

          <div className="text-right">
            <Link
              to="/recuperar-senha"
              className="text-sm font-medium text-green-600"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        {erro && (
          <p role="alert" className="mt-4 text-center text-sm text-red-600">
            {erro}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Ainda não tem uma conta?{" "}
          <Link
            to="/cadastro"
            className="font-semibold text-green-600"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
