
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MessagesSquare,
  MessageCircle,
  ChevronRight,
  House,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Conversa = {
  id: string;
  property_id: string;
  interested_user_id: string;
  owner_id: string;
  created_at: string;
};

type ImovelResumo = {
  id: string;
  titulo: string;
};

type MensagemResumo = {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
};

type ContagemNaoLidas = {
  conversa_id: string;
  total_nao_lidas: number;
};

type ConversaCompleta = Conversa & {
  tituloImovel: string;
  ultimaMensagem: string | null;
  ultimaAtividade: string;
  naoLidas: number;
};

export default function MinhasConversas() {
  const { user } = useAuth();

  const [conversas, setConversas] = useState<
    ConversaCompleta[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!user) {
      setConversas([]);
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarConversas() {
      setCarregando(true);
      setErro("");

      // O Supabase retorna somente as conversas
      // das quais o usuário participa.
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          property_id,
          interested_user_id,
          owner_id,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao buscar conversas:", error);
        setErro("Não foi possível carregar suas conversas.");
        setCarregando(false);
        return;
      }

      const lista = (data ?? []) as Conversa[];

      if (lista.length === 0) {
        setConversas([]);
        setCarregando(false);
        return;
      }

      const idsImoveis = [
        ...new Set(lista.map((item) => item.property_id)),
      ];

      const idsConversas = lista.map((item) => item.id);

      // Buscar informações necessárias em paralelo
      const [
        resultadoImoveis,
        resultadoMensagens,
        resultadoNaoLidas,
      ] = await Promise.all([
        supabase
          .from("properties")
          .select("id, titulo")
          .in("id", idsImoveis),

        supabase
          .from("messages")
          .select(
            "id, conversation_id, content, created_at"
          )
          .in("conversation_id", idsConversas)
          .order("created_at", { ascending: false }),

        supabase.rpc("contar_mensagens_nao_lidas"),
      ]);

      if (!ativo) return;

      if (resultadoImoveis.error) {
        console.error(
          "Erro ao buscar imóveis:",
          resultadoImoveis.error
        );
        setErro("Não foi possível carregar os imóveis.");
        setCarregando(false);
        return;
      }

      if (resultadoMensagens.error) {
        console.error(
          "Erro ao buscar mensagens:",
          resultadoMensagens.error
        );
        setErro("Não foi possível carregar as mensagens.");
        setCarregando(false);
        return;
      }

      if (resultadoNaoLidas.error) {
        console.error(
          "Erro ao contar mensagens não lidas:",
          resultadoNaoLidas.error
        );
        setErro(
          "Não foi possível consultar as mensagens não lidas."
        );
        setCarregando(false);
        return;
      }

      const mapaImoveis = new Map(
        (
          (resultadoImoveis.data ?? []) as ImovelResumo[]
        ).map((imovel) => [imovel.id, imovel.titulo])
      );

      const mapaMensagens = new Map<
        string,
        MensagemResumo
      >();

      // A primeira mensagem de cada conversa
      // é a mais recente.
      (
        (resultadoMensagens.data ?? []) as MensagemResumo[]
      ).forEach((mensagem) => {
        if (!mapaMensagens.has(mensagem.conversation_id)) {
          mapaMensagens.set(
            mensagem.conversation_id,
            mensagem
          );
        }
      });

      const mapaNaoLidas = new Map<string, number>();

      (
        (resultadoNaoLidas.data ?? []) as ContagemNaoLidas[]
      ).forEach((item) => {
        mapaNaoLidas.set(
          item.conversa_id,
          Number(item.total_nao_lidas) || 0
        );
      });

      const resultado: ConversaCompleta[] = lista.map(
        (conversa) => {
          const ultima = mapaMensagens.get(conversa.id);

          return {
            ...conversa,
            tituloImovel:
              mapaImoveis.get(conversa.property_id) ??
              "Imóvel indisponível",
            ultimaMensagem: ultima?.content ?? null,
            ultimaAtividade:
              ultima?.created_at ?? conversa.created_at,
            naoLidas: mapaNaoLidas.get(conversa.id) ?? 0,
          };
        }
      );

      // Conversas mais recentes primeiro
      resultado.sort(
        (a, b) =>
          new Date(b.ultimaAtividade).getTime() -
          new Date(a.ultimaAtividade).getTime()
      );

      setConversas(resultado);
      setCarregando(false);
    }

    void carregarConversas();

    return () => {
      ativo = false;
    };
  }, [user?.id]);

  function formatarData(data: string) {
    const dataMensagem = new Date(data);
    const hoje = new Date();

    if (dataMensagem.toDateString() === hoje.toDateString()) {
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(dataMensagem);
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(dataMensagem);
  }

  const totalNaoLidas = conversas.reduce(
    (total, conversa) => total + conversa.naoLidas,
    0
  );

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-md">

        <Link
          to="/perfil"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-600"
        >
          <ArrowLeft size={18} />
          Voltar ao perfil
        </Link>

        {/* Cabeçalho */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Minhas conversas
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Acompanhe suas mensagens
            </p>
          </div>

          <div className="rounded-full bg-green-50 p-3 text-green-600">
            <MessagesSquare size={25} />
          </div>
        </div>

        {/* Resumo */}
        <div className="mb-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Conversas
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {conversas.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Não lidas
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {totalNaoLidas}
            </p>
          </div>
        </div>

        {carregando ? (
          <p className="text-center text-gray-500">
            Carregando conversas...
          </p>
        ) : erro ? (
          <p
            role="alert"
            className="text-center text-red-600"
          >
            {erro}
          </p>
        ) : conversas.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <MessageCircle
              size={38}
              className="mx-auto mb-4 text-gray-300"
            />

            <h2 className="font-bold text-gray-900">
              Nenhuma conversa ainda
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Quando uma conversa for iniciada sobre um
              imóvel, ela aparecerá aqui.
            </p>

            <Link
              to="/busca"
              className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 font-semibold text-white"
            >
              Explorar imóveis
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {conversas.map((conversa, index) => {
              const souProprietario =
                conversa.owner_id === user?.id;

              const temNaoLidas = conversa.naoLidas > 0;

              return (
                <Link
                  key={conversa.id}
                  to={`/conversa/${conversa.id}`}
                  className={`flex items-center gap-3 p-4 transition hover:bg-gray-50 ${
                    index !== conversas.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <House size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2
                      className={`truncate ${
                        temNaoLidas
                          ? "font-bold"
                          : "font-semibold"
                      } text-gray-900`}
                    >
                      {conversa.tituloImovel}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {souProprietario
                        ? "Conversando com interessado"
                        : "Conversando com proprietário"}
                    </p>

                    <p
                      className={`mt-2 truncate text-sm ${
                        temNaoLidas
                          ? "font-semibold text-gray-800"
                          : "text-gray-500"
                      }`}
                    >
                      {conversa.ultimaMensagem ??
                        "Conversa iniciada. Envie uma mensagem!"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-gray-400">
                      {formatarData(conversa.ultimaAtividade)}
                    </span>

                    {temNaoLidas ? (
                      <span
                        aria-label={`${conversa.naoLidas} mensagens não lidas`}
                        className="flex h-6 min-w-6 items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-bold text-white"
                      >
                        {conversa.naoLidas > 99
                          ? "99+"
                          : conversa.naoLidas}
                      </span>
                    ) : (
                      <ChevronRight
                        size={18}
                        className="text-gray-400"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
