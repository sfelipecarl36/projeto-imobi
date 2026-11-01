
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  MapPin,
  House,
  ImageOff,
  Pencil,
  Users,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Imovel = {
  id: string;
  titulo: string;
  cidade: string;
  bairro: string;
  valor_mensal: number;
  status: string;
  property_images: {
    storage_path: string;
    ordem: number;
  }[];
};

type Contagem = {
  imovel_id: string;
  total_interessados: number;
};

export default function MeusImoveis() {
  const { user } = useAuth();

  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [contagens, setContagens] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [publicandoId, setPublicandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!user) {
      setImoveis([]);
      setContagens({});
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      setErro("");

      // Buscar os imóveis do proprietário
      const { data, error } = await supabase
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
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar imóveis:", error);
        setErro("Não foi possível carregar seus imóveis.");
        setCarregando(false);
        return;
      }

      setImoveis((data ?? []) as Imovel[]);

      // Buscar a quantidade de interessados por imóvel
      const { data: dadosContagem, error: erroContagem } =
        await supabase.rpc("contar_interessados");

      if (!ativo) return;

      if (erroContagem) {
        console.error("Erro ao contar interessados:", erroContagem);
        setErro("Não foi possível carregar a quantidade de interessados.");
        setCarregando(false);
        return;
      }

      const mapa: Record<string, number> = {};

      ((dadosContagem ?? []) as Contagem[]).forEach((item) => {
        mapa[item.imovel_id] = Number(item.total_interessados);
      });

      setContagens(mapa);
      setCarregando(false);
    }

    carregarDados();

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

  async function publicarImovel(imovelId: string) {
    if (publicandoId) return;

    setPublicandoId(imovelId);
    setMensagem("");

    const { error } = await supabase.rpc("publicar_imovel", {
      p_imovel_id: imovelId,
    });

    if (error) {
      setMensagem(error.message);
      setPublicandoId(null);
      return;
    }

    setImoveis((anteriores) =>
      anteriores.map((imovel) =>
        imovel.id === imovelId
          ? { ...imovel, status: "publicado" }
          : imovel
      )
    );

    setMensagem("Imóvel publicado com sucesso!");
    setPublicandoId(null);
  }

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-md">

        {mensagem && (
          <p
            role="status"
            className="mb-5 rounded-xl bg-white p-4 text-sm text-gray-700"
          >
            {mensagem}
          </p>
        )}

        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Meus imóveis
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gerencie seus anúncios
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Link
              to="/interessados"
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-green-600 px-4 text-sm font-semibold text-green-600"
            >
              Ver interessados
            </Link>

            <Link
              to="/anunciar"
              aria-label="Adicionar imóvel"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-white shadow-sm"
            >
              <Plus size={22} />
            </Link>
          </div>
        </div>

        {carregando ? (
          <p className="text-center text-gray-500">
            Carregando imóveis...
          </p>
        ) : erro ? (
          <p role="alert" className="text-center text-red-600">
            {erro}
          </p>
        ) : imoveis.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <House
              size={40}
              className="mx-auto mb-4 text-green-600"
            />

            <h2 className="font-bold text-gray-900">
              Nenhum imóvel cadastrado
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Cadastre seu primeiro imóvel no Muda Aí.
            </p>

            <Link
              to="/anunciar"
              className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 font-semibold text-white"
            >
              Anunciar imóvel
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {imoveis.map((imovel) => {
              const foto = obterFoto(imovel);
              const total = contagens[imovel.id] ?? 0;

              return (
                <article
                  key={imovel.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  {/* Foto */}
                  <div className="relative">
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

                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                      {imovel.status}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      {imovel.titulo}
                    </h2>

                    <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={15} />
                      {imovel.bairro}, {imovel.cidade}
                    </p>

                    <p className="mt-4 text-xl font-bold text-green-600">
                      {formatarPreco(imovel.valor_mensal)}
                      <span className="text-sm font-normal text-gray-500">
                        /mês
                      </span>
                    </p>

                    {/* Quantidade de interessados */}
                    <div className="mt-5 flex items-center justify-between rounded-xl bg-green-50 p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <Users size={20} />

                        <span className="text-sm font-semibold">
                          {total} {total === 1 ? "interessado" : "interessados"}
                        </span>
                      </div>

                      <Link
                        to="/interessados"
                        aria-label="Ver interessados"
                        className="text-green-700"
                      >
                        <ChevronRight size={21} />
                      </Link>
                    </div>

                    {/* Ações */}
                    <Link
                      to={`/meus-imoveis/${imovel.id}/editar`}
                      className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-green-600 p-3 font-semibold text-green-600"
                    >
                      <Pencil size={18} />
                      Editar imóvel
                    </Link>

                    {imovel.status === "rascunho" && (
                      <button
                        type="button"
                        onClick={() => publicarImovel(imovel.id)}
                        disabled={publicandoId !== null}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 p-3 font-semibold text-white disabled:opacity-50"
                      >
                        {publicandoId === imovel.id
                          ? "Publicando..."
                          : "Publicar imóvel"}
                      </button>
                    )}

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-500">
                        {imovel.property_images.length} foto(s)
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
