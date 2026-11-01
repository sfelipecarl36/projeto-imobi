
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  LoaderCircle,
  Wifi,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Mensagem = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ConversaDados = {
  id: string;
  property_id: string;
  interested_user_id: string;
  owner_id: string;
};

type EstadoRealtime =
  | "conectando"
  | "conectado"
  | "desconectado";

function ordenarMensagens(lista: Mensagem[]) {
  return [...lista].sort((a, b) => {
    const diferenca =
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime();

    return diferenca || a.id.localeCompare(b.id);
  });
}

function juntarMensagens(
  anteriores: Mensagem[],
  novas: Mensagem[]
) {
  const mapa = new Map<string, Mensagem>();

  anteriores.forEach((mensagem) => {
    mapa.set(mensagem.id, mensagem);
  });

  novas.forEach((mensagem) => {
    mapa.set(mensagem.id, mensagem);
  });

  return ordenarMensagens(Array.from(mapa.values()));
}

export default function Conversa() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [conversa, setConversa] = useState<ConversaDados | null>(
    null
  );

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const [estadoRealtime, setEstadoRealtime] =
    useState<EstadoRealtime>("conectando");

  const fimRef = useRef<HTMLDivElement | null>(null);

  // Evita chamadas simultâneas para marcar leitura.
  const marcandoLeituraRef = useRef(false);
  const leituraPendenteRef = useRef(false);

  // Marca como lidas as mensagens recebidas.
  async function marcarComoLidas(conversaId: string) {
    if (marcandoLeituraRef.current) {
      leituraPendenteRef.current = true;
      return;
    }

    marcandoLeituraRef.current = true;

    try {
      do {
        leituraPendenteRef.current = false;

        const { error } = await supabase.rpc(
          "marcar_mensagens_lidas",
          {
            p_conversa_id: conversaId,
          }
        );

        if (error) {
          console.error(
            "Erro ao marcar mensagens como lidas:",
            error
          );
          break;
        }
      } while (leituraPendenteRef.current);
    } finally {
      marcandoLeituraRef.current = false;
    }
  }

  // Carregar a conversa e o histórico
  useEffect(() => {
    if (!id || !user) {
      setConversa(null);
      setMensagens([]);
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro("");
      setConversa(null);
      setMensagens([]);

      const { data: dadosConversa, error: erroConversa } =
        await supabase
          .from("conversations")
          .select(
            "id, property_id, interested_user_id, owner_id"
          )
          .eq("id", id)
          .maybeSingle();

      if (!ativo) return;

      if (erroConversa || !dadosConversa) {
        setErro(
          "Conversa não encontrada ou acesso não permitido."
        );
        setCarregando(false);
        return;
      }

      const { data: dadosMensagens, error: erroMensagens } =
        await supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, content, created_at"
          )
          .eq("conversation_id", id)
          .order("created_at", { ascending: true });

      if (!ativo) return;

      setConversa(dadosConversa as ConversaDados);

      if (erroMensagens) {
        setErro("Não foi possível carregar as mensagens.");
      } else {
        setMensagens((dadosMensagens ?? []) as Mensagem[]);

        if (id) {
          void marcarComoLidas(id);
        }
      }

      setCarregando(false);
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [id, user?.id]);

  // Receber mensagens em tempo real
  useEffect(() => {
    if (!id || !user || conversa?.id !== id) {
      return;
    }

    let ativo = true;

    setEstadoRealtime("conectando");

    async function sincronizarMensagens() {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, content, created_at"
        )
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

      if (!ativo || error) return;

      setMensagens((anteriores) =>
        juntarMensagens(
          anteriores,
          (data ?? []) as Mensagem[]
        )
      );

      // Também marca mensagens que chegaram
      // durante a conexão do Realtime.
      if (id) {
        void marcarComoLidas(id);
      }
    }

    const canal = supabase
      .channel(`conversa-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          if (!ativo) return;

          const novaMensagem = payload.new as Mensagem;

          setMensagens((anteriores) =>
            juntarMensagens(anteriores, [novaMensagem])
          );

          // Mensagem recebida enquanto o chat está aberto.
          if (novaMensagem.sender_id !== user.id) {
            void marcarComoLidas(id);
          }
        }
      )
      .subscribe((status) => {
        if (!ativo) return;

        if (status === "SUBSCRIBED") {
          setEstadoRealtime("conectado");
          void sincronizarMensagens();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setEstadoRealtime("desconectado");
        }
      });

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
    };
  }, [id, user?.id, conversa?.id]);

  // Rolar até a última mensagem
  useEffect(() => {
    if (!carregando) {
      fimRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [mensagens, carregando]);

  async function enviarMensagem(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const conteudo = texto.trim();

    if (!conteudo || !conversa || !user || enviando) {
      return;
    }

    if (conteudo.length > 2000) {
      setErro(
        "A mensagem deve ter no máximo 2000 caracteres."
      );
      return;
    }

    setEnviando(true);
    setErro("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversa.id,
        sender_id: user.id,
        content: conteudo,
      })
      .select(
        "id, conversation_id, sender_id, content, created_at"
      )
      .single();

    if (error) {
      console.error("Erro ao enviar mensagem:", error);
      setErro("Não foi possível enviar a mensagem.");
    } else {
      setMensagens((anteriores) =>
        juntarMensagens(
          anteriores,
          [data as Mensagem]
        )
      );

      setTexto("");
    }

    setEnviando(false);
  }

  function formatarHora(data: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(data));
  }

  const souProprietario =
    conversa?.owner_id === user?.id;

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-4 pb-28 pt-6">
      <div className="mx-auto max-w-md">

        <Link
          to="/conversas"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600"
        >
          <ArrowLeft size={18} />
          Minhas conversas
        </Link>

        {/* Cabeçalho */}
        <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-50 p-3 text-green-600">
              <MessageCircle size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                Conversa sobre imóvel
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {souProprietario
                  ? "Conversando com interessado"
                  : "Conversando com proprietário"}
              </p>
            </div>
          </div>

          {conversa && (
            <>
              <Link
                to={`/imovel/${conversa.property_id}`}
                className="mt-4 block text-sm font-semibold text-green-600"
              >
                Ver anúncio do imóvel
              </Link>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                <Wifi
                  size={15}
                  className={
                    estadoRealtime === "conectado"
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                />

                <span className="text-xs text-gray-500">
                  {estadoRealtime === "conectado"
                    ? "Mensagens em tempo real ativas"
                    : estadoRealtime === "conectando"
                      ? "Conectando mensagens..."
                      : "Conexão em tempo real indisponível"}
                </span>
              </div>
            </>
          )}
        </div>

        {carregando ? (
          <div className="flex justify-center py-12">
            <LoaderCircle
              size={30}
              className="animate-spin text-green-600"
            />
          </div>
        ) : !conversa ? (
          <p className="rounded-xl bg-white p-5 text-center text-red-600">
            {erro || "Conversa indisponível."}
          </p>
        ) : (
          <>
            {/* Mensagens */}
            <div className="mb-4 min-h-80 space-y-4 rounded-2xl bg-white p-4 shadow-sm">
              {mensagens.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageCircle
                    size={34}
                    className="mx-auto mb-3 text-gray-300"
                  />

                  <p className="font-semibold text-gray-800">
                    Nenhuma mensagem ainda
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Envie a primeira mensagem para começar
                    a conversa.
                  </p>
                </div>
              ) : (
                mensagens.map((mensagem) => {
                  const minhaMensagem =
                    mensagem.sender_id === user?.id;

                  return (
                    <div
                      key={mensagem.id}
                      className={`flex ${
                        minhaMensagem
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          minhaMensagem
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {mensagem.content}
                        </p>

                        <p
                          className={`mt-2 text-right text-[11px] ${
                            minhaMensagem
                              ? "text-green-100"
                              : "text-gray-400"
                          }`}
                        >
                          {formatarHora(mensagem.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={fimRef} />
            </div>

            {erro && (
              <p
                role="alert"
                className="mb-3 text-sm text-red-600"
              >
                {erro}
              </p>
            )}

            {/* Enviar mensagem */}
            <form
              onSubmit={enviarMensagem}
              className="flex items-end gap-2 rounded-2xl bg-white p-3 shadow-sm"
            >
              <textarea
                value={texto}
                onChange={(event) =>
                  setTexto(event.target.value)
                }
                placeholder="Digite sua mensagem..."
                maxLength={2000}
                rows={2}
                className="max-h-32 min-h-12 flex-1 resize-none rounded-xl bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                type="submit"
                disabled={!texto.trim() || enviando}
                aria-label="Enviar mensagem"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white disabled:opacity-50"
              >
                {enviando ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
