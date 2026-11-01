
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
  CheckCircle2,
  MessageCircle,
  LoaderCircle,
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
  owner_id: string;
  property_images: Foto[];
};

export default function DetalhesImovel() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [verificandoUsuario, setVerificandoUsuario] = useState(true);
  const [verificandoInteresse, setVerificandoInteresse] = useState(true);

  const [enviandoInteresse, setEnviandoInteresse] = useState(false);
  const [interesseRegistrado, setInteresseRegistrado] = useState(false);
  const [mensagemInteresse, setMensagemInteresse] = useState("");

  const [abrindoConversa, setAbrindoConversa] = useState(false);
  const [erroConversa, setErroConversa] = useState("");

  // Verificar o usuário autenticado
  useEffect(() => {
    let ativo = true;

    async function verificarUsuario() {
      const { data } = await supabase.auth.getUser();

      if (!ativo) return;

      setUsuarioId(data.user?.id ?? null);
      setVerificandoUsuario(false);
    }

    verificarUsuario();

    return () => {
      ativo = false;
    };
  }, []);

  // Carregar imóvel publicado
  useEffect(() => {
    if (!id) {
      setErro("Imóvel não encontrado.");
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarImovel() {
      setCarregando(true);
      setErro("");
      setImovel(null);
      setFotoAtual(0);

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
          owner_id,
          property_images (
            id,
            storage_path,
            ordem
          )
        `)
        .eq("id", id)
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

  // Verificar se o usuário já demonstrou interesse
  useEffect(() => {
    let ativo = true;

    async function verificarInteresse() {
      setVerificandoInteresse(true);
      setInteresseRegistrado(false);
      setMensagemInteresse("");

      if (!id || !usuarioId) {
        if (ativo) setVerificandoInteresse(false);
        return;
      }

      const { data, error } = await supabase
        .from("property_interests")
        .select("id")
        .eq("property_id", id)
        .eq("interested_user_id", usuarioId)
        .maybeSingle();

      if (!ativo) return;

      if (error) {
        console.error("Erro ao consultar interesse:", error);
        setMensagemInteresse(
          "Não foi possível verificar seu interesse."
        );
      } else {
        setInteresseRegistrado(Boolean(data));
      }

      setVerificandoInteresse(false);
    }

    if (!verificandoUsuario) {
      verificarInteresse();
    }

    return () => {
      ativo = false;
    };
  }, [id, usuarioId, verificandoUsuario]);

  const fotos = [...(imovel?.property_images ?? [])].sort(
    (a, b) => a.ordem - b.ordem
  );

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
    if (fotos.length === 0) return;

    setFotoAtual((anterior) =>
      (anterior + 1) % fotos.length
    );
  }

  function fotoAnterior() {
    if (fotos.length === 0) return;

    setFotoAtual((anterior) =>
      (anterior - 1 + fotos.length) % fotos.length
    );
  }

  // Registrar interesse no Supabase
  async function demonstrarInteresse() {
    if (
      !imovel ||
      enviandoInteresse ||
      interesseRegistrado ||
      verificandoInteresse
    ) {
      return;
    }

    setEnviandoInteresse(true);
    setMensagemInteresse("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        navigate("/login");
        return;
      }

      if (authData.user.id === imovel.owner_id) {
        setMensagemInteresse(
          "Você não pode demonstrar interesse no próprio imóvel."
        );
        return;
      }

      const { error } = await supabase
        .from("property_interests")
        .insert({
          property_id: imovel.id,
          interested_user_id: authData.user.id,
        });

      if (error) {
        console.error("Erro ao registrar interesse:", error);

        if (error.code === "23505") {
          setInteresseRegistrado(true);
          setMensagemInteresse(
            "Você já demonstrou interesse neste imóvel."
          );
        } else {
          setMensagemInteresse(
            "Não foi possível registrar seu interesse."
          );
        }

        return;
      }

      setInteresseRegistrado(true);
      setMensagemInteresse(
        "Seu interesse foi registrado com sucesso!"
      );
    } catch (error) {
      console.error("Erro inesperado:", error);

      setMensagemInteresse(
        "Ocorreu um erro. Tente novamente."
      );
    } finally {
      setEnviandoInteresse(false);
    }
  }

  // Criar ou recuperar uma conversa existente
  async function abrirConversa() {
    if (
      !imovel ||
      !interesseRegistrado ||
      abrindoConversa
    ) {
      return;
    }

    setAbrindoConversa(true);
    setErroConversa("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        navigate("/login");
        return;
      }

      if (authData.user.id === imovel.owner_id) {
        setErroConversa(
          "Você não pode iniciar uma conversa consigo mesmo."
        );
        return;
      }

      const { data: conversaId, error } =
        await supabase.rpc("iniciar_conversa", {
          p_imovel_id: imovel.id,
        });

      if (error) {
        console.error("Erro ao iniciar conversa:", error);
        setErroConversa(
          "Não foi possível abrir a conversa. Tente novamente."
        );
        return;
      }

      if (!conversaId) {
        setErroConversa("A conversa não foi encontrada.");
        return;
      }

      navigate(`/conversa/${conversaId}`);
    } catch (error) {
      console.error("Erro inesperado ao abrir conversa:", error);
      setErroConversa(
        "Ocorreu um erro ao abrir a conversa."
      );
    } finally {
      setAbrindoConversa(false);
    }
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
          type="button"
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

        {/* Galeria de fotos */}
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
              <ImageOff
                size={40}
                className="text-gray-400"
              />
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

        {/* Informações do imóvel */}
        <div className="px-5 pt-7">
          <h1 className="text-2xl font-bold text-gray-900">
            {imovel.titulo}
          </h1>

          <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={17} />
            {imovel.bairro}, {imovel.cidade}
          </p>

          {/* Preço */}
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

          {/* Características */}
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

          {/* Descrição */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">
              Sobre o imóvel
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
              {imovel.descricao ||
                "Sem descrição disponível."}
            </p>
          </section>

          {/* Área de interesse */}
          <section className="mt-10 rounded-2xl bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">
              Gostou deste imóvel?
            </h2>

            {verificandoUsuario || verificandoInteresse ? (
              <p className="mt-4 text-sm text-gray-500">
                Verificando informações...
              </p>
            ) : usuarioId === imovel.owner_id ? (
              <p className="mt-4 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-600">
                Este imóvel pertence a você.
              </p>
            ) : interesseRegistrado ? (
              <div className="mt-5">
                <div className="rounded-xl bg-green-50 p-5 text-center">
                  <CheckCircle2
                    size={32}
                    className="mx-auto mb-3 text-green-600"
                  />

                  <p className="font-semibold text-green-700">
                    Interesse registrado!
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Você já demonstrou interesse neste imóvel.
                  </p>
                </div>

                {/* Novo botão de conversa */}
                <button
                  type="button"
                  onClick={abrirConversa}
                  disabled={abrindoConversa}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {abrindoConversa ? (
                    <>
                      <LoaderCircle
                        size={20}
                        className="animate-spin"
                      />
                      Abrindo conversa...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={20} />
                      Conversar com proprietário
                    </>
                  )}
                </button>

                {erroConversa && (
                  <p
                    role="alert"
                    className="mt-3 text-center text-sm text-red-600"
                  >
                    {erroConversa}
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Demonstre seu interesse neste imóvel.
                  O proprietário poderá visualizar sua
                  solicitação na plataforma.
                </p>

                <button
                  type="button"
                  onClick={demonstrarInteresse}
                  disabled={enviandoInteresse}
                  className="mt-5 w-full rounded-full bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {enviandoInteresse
                    ? "Enviando..."
                    : "Tenho interesse"}
                </button>
              </>
            )}

            {mensagemInteresse && !interesseRegistrado && (
              <p
                role="status"
                className="mt-3 text-center text-sm text-gray-600"
              >
                {mensagemInteresse}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
