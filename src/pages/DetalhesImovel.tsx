
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Foto = {
  id: string;
  storage_path: string;
  ordem: number;
};

type Imovel = {
  id: string;
  titulo: string;
  descricao: string | null;
  valor_mensal: number;
  cidade: string;
  bairro: string;
  quartos: number;
  banheiros: number;
  area: number | null;
  property_images: Foto[];
};

export default function DetalhesImovel() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) {
      setErro("Imóvel não encontrado.");
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarImovel() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          titulo,
          descricao,
          valor_mensal,
          cidade,
          bairro,
          quartos,
          banheiros,
          area,
          property_images (
            id,
            storage_path,
            ordem
          )
        `)
        .eq("id", id!)
        .eq("status", "publicado")
        .single();

      if (!ativo) return;

      if (error || !data) {
        setErro("Imóvel não encontrado ou indisponível.");
      } else {
        setImovel(data as Imovel);
      }

      setCarregando(false);
    }

    carregarImovel();

    return () => {
      ativo = false;
    };
  }, [id]);

  const fotos = [...(imovel?.property_images ?? [])]
    .sort((a, b) => a.ordem - b.ordem);

  function obterUrl(caminho: string) {
    return supabase.storage
      .from("property-images")
      .getPublicUrl(caminho).data.publicUrl;
  }

  function formatarValor(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function proximaFoto() {
    setFotoAtual((anterior) =>
      (anterior + 1) % fotos.length
    );
  }

  function fotoAnterior() {
    setFotoAtual((anterior) =>
      (anterior - 1 + fotos.length) % fotos.length
    );
  }

  if (carregando) {
    return (
      <main className="p-8 text-center text-gray-500">
        Carregando imóvel...
      </main>
    );
  }

  if (erro || !imovel) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-600">
          {erro || "Imóvel não encontrado."}
        </p>

        <button
          onClick={() => navigate("/busca")}
          className="mt-5 font-semibold text-green-600"
        >
          Voltar para a busca
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6F5] pb-32">
      <div className="mx-auto max-w-md">


        <div className="relative h-72 bg-gray-200">
          {fotos.length > 0 ? (
            <>
              <img
                src={obterUrl(fotos[fotoAtual].storage_path)}
                alt={`${imovel.titulo} - Foto ${fotoAtual + 1}`}
                className="h-full w-full object-cover"
              />

              {fotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={fotoAnterior}
                    aria-label="Foto anterior"
                    className="absolute bottom-5 left-4 rounded-full bg-white/90 p-2"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={proximaFoto}
                    aria-label="Próxima foto"
                    className="absolute bottom-5 right-4 rounded-full bg-white/90 p-2"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-2 text-xs text-white">
                    {fotoAtual + 1}/{fotos.length}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff size={40} className="text-gray-400" />
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/busca")}
            aria-label="Voltar"
            className="absolute left-5 top-5 rounded-full bg-white p-3 shadow"
          >
            <ArrowLeft size={20} />
          </button>
        </div>


        <div className="px-5 pt-7">
          <h1 className="text-2xl font-bold text-gray-900">
            {imovel.titulo}
          </h1>

          <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={17} />
            {imovel.bairro}, {imovel.cidade}
          </p>

          <div className="mt-6 rounded-2xl bg-white p-5">
            <p className="text-sm text-gray-500">
              Aluguel mensal
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatarValor(imovel.valor_mensal)}
              <span className="ml-1 text-sm font-normal text-gray-500">
                /mês
              </span>
            </p>
          </div>


          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-4 text-center">
              <BedDouble
                size={22}
                className="mx-auto mb-2 text-green-600"
              />
              <p className="text-sm font-semibold">
                {imovel.quartos}
              </p>
              <p className="text-xs text-gray-500">
                Quartos
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 text-center">
              <Bath
                size={22}
                className="mx-auto mb-2 text-green-600"
              />
              <p className="text-sm font-semibold">
                {imovel.banheiros}
              </p>
              <p className="text-xs text-gray-500">
                Banheiros
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 text-center">
              <Maximize
                size={22}
                className="mx-auto mb-2 text-green-600"
              />
              <p className="text-sm font-semibold">
                {imovel.area ?? "—"}
              </p>
              <p className="text-xs text-gray-500">
                m²
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">
              Sobre o imóvel
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
              {imovel.descricao || "Sem descrição disponível."}
            </p>
          </section>

          <div className="mt-10 rounded-2xl bg-white p-5">
            <h2 className="font-bold text-gray-900">
              Gostou deste imóvel?
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Em breve você poderá demonstrar interesse
              e entrar em contato com o proprietário.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 w-full rounded-full bg-green-600 p-4 font-semibold text-white opacity-50"
            >
              Tenho interesse
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
