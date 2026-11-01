
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MapPin,
  ImageOff,
  Search,
  CalendarDays,
  Trash2,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Foto = {
  storage_path: string;
  ordem: number;
};

type Imovel = {
  id: string;
  titulo: string;
  cidade: string;
  bairro: string;
  valor_mensal: number;
  status: string;
  property_images: Foto[];
};

type Interesse = {
  id: string;
  property_id: string;
  created_at: string;
};

type InteresseComImovel = Interesse & {
  imovel: Imovel | null;
};

export default function MeusInteresses() {
  const { user } = useAuth();

  const [interesses, setInteresses] = useState<
    InteresseComImovel[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setInteresses([]);
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarInteresses() {
      setCarregando(true);
      setErro("");

      const { data: registros, error: erroInteresses } =
        await supabase
          .from("property_interests")
          .select("id, property_id, created_at")
          .eq("interested_user_id", user!.id)
          .order("created_at", { ascending: false });

      if (!ativo) return;

      if (erroInteresses) {
        console.error("Erro ao carregar interesses:", erroInteresses);
        setErro("Não foi possível carregar seus interesses.");
        setCarregando(false);
        return;
      }

      const lista = (registros ?? []) as Interesse[];

      if (lista.length === 0) {
        setInteresses([]);
        setCarregando(false);
        return;
      }

      const ids = lista.map((item) => item.property_id);

      const { data: imoveis, error: erroImoveis } =
        await supabase
          .from("properties")
          .select(`
            id,
            titulo,
            cidade,
            bairro,
            valor_mensal,
            status,
            property_images (
              storage_path,
              ordem
            )
          `)
          .in("id", ids)
          .eq("status", "publicado");

      if (!ativo) return;

      if (erroImoveis) {
        console.error("Erro ao carregar imóveis:", erroImoveis);
        setErro("Não foi possível carregar os imóveis.");
        setCarregando(false);
        return;
      }

      const mapaImoveis = new Map(
        ((imoveis ?? []) as Imovel[]).map((imovel) => [
          imovel.id,
          imovel,
        ])
      );

      const resultado = lista.map((interesse) => ({
        ...interesse,
        imovel: mapaImoveis.get(interesse.property_id) ?? null,
      }));

      setInteresses(resultado);
      setCarregando(false);
    }

    carregarInteresses();

    return () => {
      ativo = false;
    };
  }, [user?.id]);

  function obterFoto(imovel: Imovel) {
    const fotos = [...(imovel.property_images ?? [])].sort(
      (a, b) => a.ordem - b.ordem
    );

    if (fotos.length === 0) return null;

    return supabase.storage
      .from("property-images")
      .getPublicUrl(fotos[0].storage_path).data.publicUrl;
  }

  function formatarPreco(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
    }).format(new Date(data));
  }

  async function cancelarInteresse(interesseId: string) {
    if (!user || cancelandoId) return;

    setCancelandoId(interesseId);
    setMensagem("");
    setErro("");

    const { data, error } = await supabase
      .from("property_interests")
      .delete()
      .eq("id", interesseId)
      .eq("interested_user_id", user.id)
      .select("id");

    if (error) {
      console.error("Erro ao cancelar interesse:", error);
      setMensagem("Não foi possível cancelar o interesse.");
    } else if (!data || data.length === 0) {
      setMensagem(
        "O interesse não foi encontrado ou não pôde ser cancelado."
      );
    } else {
      setInteresses((anteriores) =>
        anteriores.filter((item) => item.id !== interesseId)
      );

      setMensagem("Interesse cancelado com sucesso.");
    }

    setCancelandoId(null);
    setConfirmandoId(null);
  }

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-md">

        <Link
          to="/perfil"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>

        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Meus interesses
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Imóveis que despertaram seu interesse
            </p>
          </div>

          <div className="rounded-full bg-green-50 p-3 text-green-600">
            <Heart size={24} />
          </div>
        </div>

        <div className="mb-7 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total de interesses
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {interesses.length}
          </p>
        </div>

        {mensagem && (
          <p
            role="status"
            className="mb-5 rounded-xl bg-white p-4 text-sm text-gray-700"
          >
            {mensagem}
          </p>
        )}

        {carregando ? (
          <p className="text-center text-gray-500">
            Carregando seus interesses...
          </p>
        ) : erro ? (
          <p role="alert" className="text-center text-red-600">
            {erro}
          </p>
        ) : interesses.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <Heart
              size={38}
              className="mx-auto mb-4 text-gray-300"
            />

            <h2 className="font-bold text-gray-900">
              Nenhum interesse registrado
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Explore os imóveis disponíveis e encontre
              um lugar para chamar de seu.
            </p>

            <Link
              to="/busca"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 font-semibold text-white"
            >
              <Search size={18} />
              Explorar imóveis
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {interesses.map((interesse) => {
              const imovel = interesse.imovel;
              const foto = imovel ? obterFoto(imovel) : null;

              return (
                <article
                  key={interesse.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  {imovel ? (
                    <>
                      {foto ? (
                        <img
                          src={foto}
                          alt={imovel.titulo}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gray-100">
                          <ImageOff
                            size={36}
                            className="text-gray-400"
                          />
                        </div>
                      )}

                      <div className="p-5">
                        <h2 className="text-lg font-bold text-gray-900">
                          {imovel.titulo}
                        </h2>

                        <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <MapPin size={16} />
                          {imovel.bairro}, {imovel.cidade}
                        </p>

                        <p className="mt-4 text-xl font-bold text-green-600">
                          {formatarPreco(imovel.valor_mensal)}
                          <span className="text-sm font-normal text-gray-500">
                            /mês
                          </span>
                        </p>

                        <p className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                          <CalendarDays size={15} />
                          Interesse em {formatarData(interesse.created_at)}
                        </p>

                        <Link
                          to={`/imovel/${imovel.id}`}
                          className="mt-5 block rounded-xl bg-green-600 px-4 py-3 text-center font-semibold text-white"
                        >
                          Ver imóvel
                        </Link>

                        {confirmandoId === interesse.id ? (
                          <div className="mt-4 rounded-xl bg-red-50 p-4">
                            <p className="text-sm text-gray-700">
                              Deseja realmente cancelar seu interesse?
                            </p>

                            <div className="mt-3 flex gap-3">
                              <button
                                type="button"
                                onClick={() => setConfirmandoId(null)}
                                disabled={cancelandoId !== null}
                                className="flex-1 rounded-lg border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-700"
                              >
                                Voltar
                              </button>

                              <button
                                type="button"
                                onClick={() => cancelarInteresse(interesse.id)}
                                disabled={cancelandoId !== null}
                                className="flex-1 rounded-lg bg-red-600 p-3 text-sm font-semibold text-white disabled:opacity-50"
                              >
                                {cancelandoId === interesse.id
                                  ? "Cancelando..."
                                  : "Confirmar"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmandoId(interesse.id)}
                            disabled={cancelandoId !== null}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 p-3 text-sm font-semibold text-red-600"
                          >
                            <Trash2 size={17} />
                            Cancelar interesse
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-5">
                      <p className="font-semibold text-gray-800">
                        Imóvel indisponível
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        Este anúncio não está mais disponível.
                      </p>

                      <button
                        type="button"
                        onClick={() => setConfirmandoId(interesse.id)}
                        className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600"
                      >
                        <Trash2 size={17} />
                        Remover da lista
                      </button>

                      {confirmandoId === interesse.id && (
                        <div className="mt-3 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setConfirmandoId(null)}
                            className="flex-1 rounded-xl border p-3 text-sm"
                          >
                            Voltar
                          </button>

                          <button
                            type="button"
                            onClick={() => cancelarInteresse(interesse.id)}
                            disabled={cancelandoId !== null}
                            className="flex-1 rounded-xl bg-red-600 p-3 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {cancelandoId === interesse.id
                              ? "Removendo..."
                              : "Confirmar"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
