
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  ImageOff,
  House,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Imovel = {
  id: string;
  titulo: string;
  cidade: string;
  bairro: string;
  valor_mensal: number;
  quartos: number;
  banheiros: number;
  area: number | null;
  property_images: {
    storage_path: string;
    ordem: number;
  }[];
};

export default function Busca() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarImoveis() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          titulo,
          cidade,
          bairro,
          valor_mensal,
          quartos,
          banheiros,
          area,
          property_images (
            storage_path,
            ordem
          )
        `)
        .eq("status", "publicado")
        .order("created_at", { ascending: false });

      if (error) {
        setErro("Não foi possível carregar os imóveis.");
      } else {
        setImoveis((data ?? []) as Imovel[]);
      }

      setCarregando(false);
    }

    carregarImoveis();
  }, []);

  function obterCapa(imovel: Imovel) {
    const imagens = [...(imovel.property_images ?? [])]
      .sort((a, b) => a.ordem - b.ordem);

    if (imagens.length === 0) return null;

    return supabase.storage
      .from("property-images")
      .getPublicUrl(imagens[0].storage_path).data.publicUrl;
  }

  function formatarValor(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  // Filtrar por título, cidade ou bairro
  const imoveisFiltrados = imoveis.filter((imovel) => {
    const texto = [
      imovel.titulo,
      imovel.cidade,
      imovel.bairro,
    ].join(" ").toLocaleLowerCase("pt-BR");

    return texto.includes(
      pesquisa.trim().toLocaleLowerCase("pt-BR")
    );
  });

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-10">
      <div className="mx-auto max-w-md">

        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Encontre seu novo lar
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Imóveis disponíveis para aluguel mensal
            </p>
          </div>

          <div className="rounded-full bg-green-50 p-3 text-green-600">
            <House size={25} />
          </div>
        </div>

        {/* Campo de pesquisa */}
        <div className="mb-7 flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
          <Search size={21} className="text-gray-400" />

          <input
            type="search"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Cidade, bairro ou imóvel..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {carregando ? (
          <p className="text-center text-gray-500">
            Buscando imóveis...
          </p>
        ) : erro ? (
          <p role="alert" className="text-center text-red-600">
            {erro}
          </p>
        ) : (
          <>
            <p className="mb-5 text-sm text-gray-500">
              {imoveisFiltrados.length} imóvel(is) encontrado(s)
            </p>

            {imoveisFiltrados.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center">
                <Search
                  size={36}
                  className="mx-auto mb-3 text-gray-300"
                />

                <p className="font-semibold text-gray-800">
                  Nenhum imóvel encontrado
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Tente pesquisar outra cidade ou bairro.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {imoveisFiltrados.map((imovel) => {
                  const capa = obterCapa(imovel);

                  return (
                    <Link
                      key={imovel.id}
                      to={`/imovel/${imovel.id}`}
                      className="block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
                    >
                      {capa ? (
                        <img
                          src={capa}
                          alt={imovel.titulo}
                          className="h-52 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-52 items-center justify-center bg-gray-100">
                          <ImageOff
                            size={34}
                            className="text-gray-400"
                          />
                        </div>
                      )}

                      <div className="p-5">
                        <h2 className="text-lg font-bold text-gray-900">
                          {imovel.titulo}
                        </h2>

                        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin size={16} />
                          {imovel.bairro}, {imovel.cidade}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BedDouble size={16} />
                            {imovel.quartos} quartos
                          </span>

                          <span className="flex items-center gap-1">
                            <Bath size={16} />
                            {imovel.banheiros} banheiros
                          </span>

                          {imovel.area != null && (
                            <span className="flex items-center gap-1">
                              <Maximize size={16} />
                              {imovel.area} m²
                            </span>
                          )}
                        </div>

                        <div className="mt-5 border-t border-gray-100 pt-4">
                          <span className="text-xl font-bold text-green-600">
                            {formatarValor(imovel.valor_mensal)}
                          </span>

                          <span className="ml-1 text-xs text-gray-500">
                            /mês
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
