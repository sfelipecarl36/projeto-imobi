import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

import GerenciarFotos from "../components/GerenciarFotos";

export default function EditarImovel() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [quartos, setQuartos] = useState("0");
  const [banheiros, setBanheiros] = useState("0");
  const [area, setArea] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id || !user) {
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarImovel() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
            titulo,
            descricao,
            valor_mensal,
            cidade,
            bairro,
            endereco,
            quartos,
            banheiros,
            area
            `)
        .eq("id", id)
        .eq("owner_id", user!.id)
        .single();

      if (!ativo) return;

      if (error) {
        setErro("Imóvel não encontrado ou acesso não permitido.");
      } else {
        setTitulo(data.titulo);
        setDescricao(data.descricao ?? "");
        setValor(String(data.valor_mensal));
        setCidade(data.cidade);
        setBairro(data.bairro);
        setEndereco(data.endereco ?? "");
        setQuartos(String(data.quartos));
        setBanheiros(String(data.banheiros));
        setArea(data.area == null ? "" : String(data.area));
      }

      setCarregando(false);
    }

    carregarImovel();

    return () => {
      ativo = false;
    };
  }, [id, user]);

  async function salvarAlteracoes(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!id || !user || salvando || erro) return;

    setSalvando(true);

    const { error } = await supabase
      .from("properties")
      .update({
        titulo,
        descricao,
        valor_mensal: Number(valor),
        cidade,
        bairro,
        endereco,
        quartos: Number(quartos),
        banheiros: Number(banheiros),
        area: area ? Number(area) : null,
        })
      .eq("id", id)
      .eq("owner_id", user.id);

    setSalvando(false);

    if (error) {
      setErro("Não foi possível salvar as alterações.");
      return;
    }

    navigate("/meus-imoveis");
  }

  if (carregando) {
    return (
      <main className="p-8 text-center text-gray-500">
        Carregando imóvel...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-md">

        <button
          onClick={() => navigate("/meus-imoveis")}
          className="mb-6 flex items-center gap-2 text-gray-600"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Editar imóvel
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Atualize as informações do anúncio.
        </p>

        {erro && (
          <p role="alert" className="mt-5 text-sm text-red-600">
            {erro}
          </p>
        )}

        {!erro && (
            <>
          <form onSubmit={salvarAlteracoes} className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Título
              </label>

              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white p-4 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Descrição
              </label>

              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 outline-none focus:border-green-600"
              />
            </div>

            
            <div>
            <label className="mb-2 block text-sm font-semibold">
                Aluguel mensal (R$)
            </label>
            <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4"
            />
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="mb-2 block text-sm font-semibold">
                Cidade
                </label>
                <input
                required
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-semibold">
                Bairro
                </label>
                <input
                required
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4"
                />
            </div>
            </div>

            <div>
            <label className="mb-2 block text-sm font-semibold">
                Endereço
            </label>
            <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4"
            />
            </div>

            <div className="grid grid-cols-3 gap-3">
            <div>
                <label className="mb-2 block text-xs font-semibold">
                Quartos
                </label>
                <input
                type="number"
                min="0"
                value={quartos}
                onChange={(e) => setQuartos(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4"
                />
            </div>

            <div>
                <label className="mb-2 block text-xs font-semibold">
                Banheiros
                </label>
                <input
                type="number"
                min="0"
                value={banheiros}
                onChange={(e) => setBanheiros(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4"
                />
            </div>

            <div>
                <label className="mb-2 block text-xs font-semibold">
                Área (m²)
                </label>
                <input
                type="number"
                min="0.01"
                step="0.01"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4"
                />
            </div>
            </div>


            <button
              type="submit"
              disabled={salvando}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 p-4 font-semibold text-white disabled:opacity-50"
            >
              <Save size={19} />
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>

          </form>
          {id && <GerenciarFotos imovelId={id} />}
          </>


        )}
      </div>
    </main>
  );
}
