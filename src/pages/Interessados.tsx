
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserRound,
  House,
  CalendarDays,
  Filter,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Interesse = {
  interesse_id: string;
  imovel_id: string;
  imovel_titulo: string;
  interessado_nome: string | null;
  data_interesse: string;
};

export default function Interessados() {
  const [interesses, setInteresses] = useState<Interesse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // "todos" significa que nenhum imóvel específico foi selecionado
  const [filtroImovel, setFiltroImovel] = useState("todos");

  useEffect(() => {
    let ativo = true;

    async function carregarInteresses() {
      setCarregando(true);
      setErro("");

      const { data, error } = await supabase.rpc(
        "listar_interessados"
      );

      if (!ativo) return;

      if (error) {
        console.error("Erro ao listar interessados:", error);
        setErro("Não foi possível carregar os interessados.");
      } else {
        setInteresses((data ?? []) as Interesse[]);
      }

      setCarregando(false);
    }

    carregarInteresses();

    return () => {
      ativo = false;
    };
  }, []);

  // Criar uma lista de imóveis sem repetições
  const imoveisComInteresse = useMemo(() => {
    const mapa = new Map<string, string>();

    interesses.forEach((interesse) => {
      mapa.set(interesse.imovel_id, interesse.imovel_titulo);
    });

    return Array.from(mapa.entries()).map(([id, titulo]) => ({
      id,
      titulo,
    }));
  }, [interesses]);

  // Mostrar somente os interessados do imóvel selecionado
  const interessesFiltrados = useMemo(() => {
    if (filtroImovel === "todos") {
      return interesses;
    }

    return interesses.filter(
      (interesse) => interesse.imovel_id === filtroImovel
    );
  }, [interesses, filtroImovel]);

  function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(data));
  }

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-md">

        {/* Voltar */}
        <Link
          to="/meus-imoveis"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-600"
        >
          <ArrowLeft size={18} />
          Voltar para meus imóveis
        </Link>

        {/* Cabeçalho */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Interessados
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Solicitações recebidas nos seus imóveis
            </p>
          </div>

          <div className="rounded-full bg-green-50 p-3 text-green-600">
            <Users size={25} />
          </div>
        </div>

        {/* Resumo */}
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            {filtroImovel === "todos"
              ? "Total de interessados"
              : "Interessados neste imóvel"}
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {interessesFiltrados.length}
          </p>
        </div>

        {/* Filtro */}
        {!carregando && !erro && imoveisComInteresse.length > 0 && (
          <div className="mb-7 rounded-2xl bg-white p-4 shadow-sm">
            <label
              htmlFor="filtro-imovel"
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800"
            >
              <Filter size={17} className="text-green-600" />
              Filtrar por imóvel
            </label>

            <select
              id="filtro-imovel"
              value={filtroImovel}
              onChange={(event) =>
                setFiltroImovel(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none focus:border-green-600"
            >
              <option value="todos">
                Todos os imóveis
              </option>

              {imoveisComInteresse.map((imovel) => (
                <option key={imovel.id} value={imovel.id}>
                  {imovel.titulo}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Conteúdo */}
        {carregando ? (
          <p className="text-center text-gray-500">
            Carregando interessados...
          </p>
        ) : erro ? (
          <p
            role="alert"
            className="text-center text-red-600"
          >
            {erro}
          </p>
        ) : interesses.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <Users
              size={36}
              className="mx-auto mb-3 text-gray-300"
            />

            <p className="font-semibold text-gray-800">
              Nenhum interessado ainda
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Quando alguém demonstrar interesse nos seus
              imóveis, aparecerá aqui.
            </p>
          </div>
        ) : interessesFiltrados.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <p className="font-semibold text-gray-800">
              Nenhum interessado encontrado
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Não há solicitações para o imóvel selecionado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {interessesFiltrados.map((interesse) => (
              <article
                key={interesse.interesse_id}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-50 p-3 text-green-600">
                    <UserRound size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900">
                      {interesse.interessado_nome ||
                        "Usuário cadastrado"}
                    </h2>

                    <p className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                      <House
                        size={16}
                        className="mt-0.5 shrink-0"
                      />

                      {interesse.imovel_titulo}
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <CalendarDays size={15} />
                      {formatarData(interesse.data_interesse)}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/imovel/${interesse.imovel_id}`}
                  className="mt-4 block rounded-xl bg-gray-100 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  Ver imóvel
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
