
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function AnunciarImovel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [quartos, setQuartos] = useState("0");
  const [banheiros, setBanheiros] = useState("0");
  const [area, setArea] = useState("");

  const [fotos, setFotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Selecionar imagens
  function selecionarFotos(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);

    const permitidos = ["image/jpeg", "image/png", "image/webp"];

    const invalidos = arquivos.some(
      (arquivo) =>
        !permitidos.includes(arquivo.type) ||
        arquivo.size > 5 * 1024 * 1024
    );

    if (invalidos) {
      setMensagem("Use imagens JPG, PNG ou WebP de até 5 MB.");
      e.target.value = "";
      return;
    }

    if (fotos.length + arquivos.length > 10) {
      setMensagem("Você pode adicionar até 10 fotos.");
      e.target.value = "";
      return;
    }

    setFotos((anteriores) => [...anteriores, ...arquivos]);
    setMensagem("");
    e.target.value = "";
  }

  function removerFoto(index: number) {
    setFotos((anteriores) =>
      anteriores.filter((_, i) => i !== index)
    );
  }

  async function salvarImovel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user || loading) return;

    setLoading(true);
    setMensagem("");

    try {
    
      const { data: imovel, error: erroImovel } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          titulo,
          descricao,
          valor_mensal: Number(valor),
          cidade,
          bairro,
          endereco,
          quartos: Number(quartos),
          banheiros: Number(banheiros),
          area: area ? Number(area) : null,
          status: "rascunho",
        })
        .select("id")
        .single();

      if (erroImovel) throw erroImovel;

      let falhas = 0;

      for (const [index, foto] of fotos.entries()) {
        const extensao = foto.name.split(".").pop()?.toLowerCase();
        const caminho = `${user.id}/${imovel.id}/${crypto.randomUUID()}.${extensao}`;

        const { error: erroUpload } = await supabase.storage
          .from("property-images")
          .upload(caminho, foto);

        if (erroUpload) {
          falhas++;
          continue;
        }

        const { error: erroRegistro } = await supabase
          .from("property_images")
          .insert({
            property_id: imovel.id,
            storage_path: caminho,
            ordem: index,
          });

        if (erroRegistro) {
          falhas++;


          await supabase.storage
            .from("property-images")
            .remove([caminho]);
        }
      }

      if (falhas > 0) {
        setMensagem(
          `Imóvel salvo, mas ${falhas} foto(s) falharam. Verifique o Storage.`
        );
        return;
      }

      navigate("/meus-imoveis");
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o imóvel."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm outline-none focus:border-green-500";

  return (
    <main className="min-h-screen bg-[#F4F6F5] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-md">

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Anunciar imóvel
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Preencha as informações do seu imóvel.
        </p>

        <form onSubmit={salvarImovel} className="mt-8 space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Título do anúncio
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Apartamento com 2 quartos"
              required
              className={inputStyle}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva os detalhes do imóvel..."
              rows={4}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Valor mensal (R$)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Cidade
              </label>
              <input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                required
                className={inputStyle}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Bairro
              </label>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                required
                className={inputStyle}
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
              placeholder="Rua, número..."
              className={inputStyle}
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
                className={inputStyle}
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
                className={inputStyle}
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
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold">
              Fotos do imóvel ({fotos.length}/10)
            </label>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-gray-500">
              <ImagePlus size={32} className="text-green-600" />
              <span className="text-sm font-medium">
                Adicionar fotos
              </span>
              <span className="text-xs">
                JPG, PNG ou WebP · Máximo 5 MB
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={selecionarFotos}
                className="hidden"
              />
            </label>

            {fotos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {fotos.map((foto, index) => (
                  <FotoPreview
                    key={`${foto.name}-${index}`}
                    foto={foto}
                    onRemove={() => removerFoto(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {mensagem && (
            <p role="alert" className="text-sm text-red-600">
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-green-600 p-4 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar rascunho"}
          </button>
        </form>
      </div>
    </main>
  );
}

function FotoPreview({
  foto,
  onRemove,
}: {
  foto: File;
  onRemove: () => void;
}) {
  const [url] = useState(() => URL.createObjectURL(foto));


  return (
    <div className="relative">
      <img
        src={url}
        alt="Prévia do imóvel"
        className="h-24 w-full rounded-xl object-cover"
      />

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"
      >
        <X size={14} />
      </button>
    </div>
  );
}
