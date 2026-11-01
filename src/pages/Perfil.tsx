
import { useNavigate, Link } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function Perfil() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const nome = user?.user_metadata?.nome ?? "";
  const email = user?.email ?? "";

  async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Não foi possível sair da conta.");
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10 pb-28">
      <div className="mx-auto max-w-md">

        <h1 className="text-2xl font-bold text-gray-900">
          Meu perfil
        </h1>

        {user ? (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-4">
              <div className="rounded-full bg-green-50 p-4 text-green-600">
                <UserRound size={28} />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  {nome || "Usuário"}
                </h2>

                <p className="text-sm text-gray-500">
                  {email}
                </p>
              </div>
            </div>

            <button
              onClick={sair}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 p-4 font-semibold text-red-600"
            >
              <LogOut size={19} />
              Sair da conta
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-white p-6 text-center">
            <p className="mb-5 text-gray-500">
              Entre na sua conta para visualizar seu perfil.
            </p>

            <Link
              to="/login"
              className="inline-block rounded-full bg-green-600 px-8 py-3 font-semibold text-white"
            >
              Fazer login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
