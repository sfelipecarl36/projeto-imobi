import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Foto = {
  id: string;
  storage_path: string;
  ordem: number;
};

type Props = {
  imovelId: string;
};

export default function GerenciarFotos({ imovelId }: Props) {
  const { user } = useAuth();

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarFotos() {
    const { data, error } = await supabase
      .from("property_images")
      .select("id, storage_path, ordem")
      .eq("property_id", imovelId)
      .order("ordem", { ascending: true });

    if (error) {
      setErro("Não foi possível carregar as fotos.");
    } else {
      setFotos(data ?? []);
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarFotos();
  }, [imovelId]);

  function obterUrl(caminho: string) {
    return supabase.storage
      .from("property-images")
      .getPublicUrl(caminho).data.publicUrl;
  }

  async function adicionarFotos(
    e: ChangeEvent<HTMLInputElement>
  ) {
    if (!user || processando) return;

    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (arquivos.length === 0) return;

    const tipos = ["image/jpeg", "image/png", "image/webp"];

    if (
      arquivos.some(
        (arquivo) =>
          !tipos.includes(arquivo.type) ||
          arquivo.size > 5 * 1024 * 1024
      )
    ) {
      setErro("Escolha imagens JPG, PNG ou WebP de até 5 MB.");
      return;
    }

    if (fotos.length + arquivos.length > 10) {
      setErro("O limite é de 10 fotos por imóvel.");
      return;
    }

    setProcessando(true);
    setErro("");

    try {
      for (const arquivo of arquivos) {
        const extensao = arquivo.type === "image/png"
          ? "png"
          : arquivo.type === "image/webp"
          ? "webp"
          : "jpg";

        const caminho =
          `${user.id}/${imovelId}/${crypto.randomUUID()}.${extensao}`;

        const { error: erroUpload } = await supabase.storage
          .from("property-images")
          .upload(caminho, arquivo);

        if (erroUpload) throw erroUpload;

        const proximaOrdem =
          fotos.length === 0
            ? 0
            : Math.max(...fotos.map((foto) => foto.ordem)) + 1;

        const { error: erroRegistro } = await supabase
          .from("property_images")
          .insert({
            property_id: imovelId,
            storage_path: caminho,
            ordem: proximaOrdem,
          });

        if (erroRegistro) {
          await supabase.storage
            .from("property-images")
            .remove([caminho]);

          throw erroRegistro;
        }

        // Atualiza a lista antes da próxima foto
        await carregarFotos();
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao enviar as fotos."
      );
    } finally {
      await carregarFotos();
      setProcessando(false);
    }
  }

  async function excluirFoto(foto: Foto) {
    if (processando) return;

    const confirmou = window.confirm(
      "Deseja realmente excluir esta foto?"
    );

    if (!confirmou) return;

    setProcessando(true);
    setErro("");

    try {
      // Primeiro remove o arquivo do Storage
      const { error: erroStorage } = await supabase.storage
        .from("property-images")
        .remove([foto.storage_path]);

      if (erroStorage) throw erroStorage;

      // Depois remove o registro
      const { error: erroBanco } = await supabase
        .from("property_images")
        .delete()
        .eq("id", foto.id)
        .eq("property_id", imovelId);

      if (erroBanco) throw erroBanco;

      await carregarFotos();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a foto."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function definirCapa(fotoSelecionada: Foto) {
    if (processando) return;

    setProcessando(true);
    setErro("");

    try {
      const novaOrdem = [
        fotoSelecionada,
        ...fotos.filter((foto) => foto.id !== fotoSelecionada.id),
      ];

      for (const [index, foto] of novaOrdem.entries()) {
        const { error } = await supabase
          .from("property_images")
          .update({ ordem: index })
          .eq("id", foto.id)
          .eq("property_id", imovelId);

        if (error) throw error;
      }

      await carregarFotos();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a capa."
      );
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-gray-500">Carregando fotos...</p>;
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900">
        Fotos do imóvel
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {fotos.length}/10 fotos · A primeira será a capa.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {fotos.map((foto, index) => (
          <div
            key={foto.id}
            className="relative overflow-hidden rounded-xl bg-white"
          >
            <img
              src={obterUrl(foto.storage_path)}
              alt={`Foto ${index + 1}`}
              className="h-36 w-full object-cover"
            />

            <div className="flex items-center justify-between p-2">
              <button
                type="button"
                disabled={processando || index === 0}
                onClick={() => definirCapa(foto)}
                className="flex items-center gap-1 text-xs font-medium text-green-600 disabled:text-gray-400"
              >
                <Star size={15} />
                {index === 0 ? "Capa" : "Definir capa"}
              </button>

              <button
                type="button"
                disabled={processando}
                onClick={() => excluirFoto(foto)}
                aria-label="Excluir foto"
                className="text-red-500 disabled:opacity-40"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6">
        <ImagePlus size={28} className="text-green-600" />
        <span className="text-sm font-semibold text-gray-700">
          Adicionar fotos
        </span>
        <span className="text-xs text-gray-400">
          JPG, PNG ou WebP · Até 5 MB
        </span>

        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={adicionarFotos}
          disabled={processando || fotos.length >= 10}
          className="hidden"
        />
      </label>

      {processando && (
        <p className="mt-3 text-sm text-gray-500">
          Processando imagens...
        </p>
      )}

      {erro && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {erro}
        </p>
      )}
    </section>
  );
}
