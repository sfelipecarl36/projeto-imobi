
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LogOut,
  UserRound,
  House,
  Heart,
  Users,
  PlusCircle,
  ChevronRight,
  Crown,
  MessagesSquare,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Atalho = {
  titulo: string;
  descricao: string;
  caminho: string;
  icone: typeof House;
};

type ContagemNaoLidas = {
  conversa_id: string;
  total_nao_lidas: number;
};

const atalhos: Atalho[] = [
  {
    titulo: "Meus imóveis",
    descricao: "Gerencie seus anúncios",
    caminho: "/meus-imoveis",
    icone: House,
  },
  {
    titulo: "Meus interesses",
    descricao: "Imóveis que você gostou",
    caminho: "/meus-interesses",
    icone: Heart,
  },
  {
    titulo: "Minhas conversas",
    descricao: "Acompanhe suas mensagens",
    caminho: "/conversas",
    icone: MessagesSquare,
  },
  {
    titulo: "Interessados",
    descricao: "Solicitações recebidas",
    caminho: "/interessados",
    icone: Users,
  },
  {
    titulo: "Anunciar imóvel",
    descricao: "Cadastre uma nova propriedade",
    caminho: "/anunciar",
    icone: PlusCircle,
  },
];

export default function Perfil() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plano, setPlano] = useState<
    "gratuito" | "pro" | "indisponivel"
  >("indisponivel");

  const [carregandoPlano, setCarregandoPlano] = useState(true);
  const [saindo, setSaindo] = useState(false);

  const [totalNaoLidas, setTotalNaoLidas] = useState(0);

  const nome = user?.user_metadata?.nome ?? "";
  const email = user?.email ?? "";

  // Consultar a assinatura do usuário
  useEffect(() => {
    let ativo = true;

    async function carregarPlano() {
      if (!user) {
        setPlano("indisponivel");
        setCarregandoPlano(false);
        return;
      }

      setCarregandoPlano(true);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ativo) return;

      if (error) {
        console.error("Erro ao consultar plano:", error);
        setPlano("indisponivel");
      } else {
        const proAtivo =
          data?.status === "active" &&
          !!data.current_period_end &&
          new Date(data.current_period_end).getTime() >
            Date.now();

        setPlano(proAtivo ? "pro" : "gratuito");
      }

      setCarregandoPlano(false);
    }

    void carregarPlano();

    return () => {
      ativo = false;
    };
  }, [user?.id]);

  // Consultar mensagens não lidas
  useEffect(() => {
    if (!user) {
      setTotalNaoLidas(0);
      return;
    }

    let ativo = true;

    async function carregarNaoLidas() {
      const { data, error } = await supabase.rpc(
        "contar_mensagens_nao_lidas"
      );

      if (!ativo) return;

      if (error) {
        console.error(
          "Erro ao consultar mensagens não lidas:",
          error
        );
        return;
      }

      const total = (
        (data ?? []) as ContagemNaoLidas[]
      ).reduce(
        (soma, item) =>
          soma + (Number(item.total_nao_lidas) || 0),
        0
      );

      setTotalNaoLidas(total);
    }

    // Carregar o contador ao abrir o perfil
    void carregarNaoLidas();

    // Atualizar quando o usuário voltar para a aba
    function aoVoltarParaAba() {
      if (document.visibilityState === "visible") {
        void carregarNaoLidas();
      }
    }

    // Atualizar quando o usuário voltar à janela
    function aoFocarJanela() {
      void carregarNaoLidas();
    }

    document.addEventListener(
      "visibilitychange",
      aoVoltarParaAba
    );

    window.addEventListener("focus", aoFocarJanela);

    return () => {
      ativo = false;

      document.removeEventListener(
        "visibilitychange",
        aoVoltarParaAba
      );

      window.removeEventListener(
        "focus",
        aoFocarJanela
      );
    };
  }, [user?.id]);

  async function sair() {
    if (saindo) return;

    setSaindo(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Não foi possível sair da conta.");
      setSaindo(false);
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-md">

        {/* Cabeçalho */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">
            Meu perfil
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gerencie sua conta e seus imóveis
          </p>
        </div>

        {user ? (
          <>
            {/* Dados do usuário */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <UserRound size={28} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="break-words font-bold text-gray-900">
                    {nome || "Usuário"}
                  </h2>

                  <p className="mt-1 break-all text-sm text-gray-500">
                    {email}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500">
                  Sua assinatura
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    plano === "pro"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {carregandoPlano
                    ? "Carregando..."
                    : plano === "pro"
                      ? "Muda Aí PRO"
                      : plano === "gratuito"
                        ? "Plano gratuito"
                        : "Indisponível"}
                </span>
              </div>
            </section>

            {/* Atalhos */}
            <section className="mt-8">
              <h2 className="mb-4 text-base font-bold text-gray-900">
                Meus imóveis e atividades
              </h2>

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {atalhos.map((atalho, index) => {
                  const Icone = atalho.icone;

                  const ehConversas =
                    atalho.caminho === "/conversas";

                  return (
                    <Link
                      key={atalho.caminho}
                      to={atalho.caminho}
                      className={`flex items-center gap-3 p-4 transition hover:bg-gray-50 ${
                        index !== atalhos.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                        <Icone size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {atalho.titulo}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {atalho.descricao}
                        </p>
                      </div>

                      {ehConversas && totalNaoLidas > 0 && (
                        <span
                          aria-label={`${totalNaoLidas} mensagens não lidas`}
                          className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-bold text-white"
                        >
                          {totalNaoLidas > 99
                            ? "99+"
                            : totalNaoLidas}
                        </span>
                      )}

                      <ChevronRight
                        size={19}
                        className="shrink-0 text-gray-400"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Plano PRO */}
            <section className="mt-7 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Crown size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Muda Aí PRO
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Publique múltiplos imóveis e ganhe destaque.
                    Disponível em breve.
                  </p>
                </div>
              </div>
            </section>

            {/* Sair da conta */}
            <button
              type="button"
              onClick={sair}
              disabled={saindo}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white p-4 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut size={19} />
              {saindo ? "Saindo..." : "Sair da conta"}
            </button>
          </>
        ) : (
          <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm">
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
