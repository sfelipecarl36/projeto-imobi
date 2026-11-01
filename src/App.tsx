import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";

/* Componentes */
import Tabs from "./components/Tabs";
import ProtectedRoute from "./components/ProtectedRoute";

/* Páginas */
import Home from "./pages/Home";
import Busca from "./pages/Busca";
import Booking from "./pages/Booking";
import Perfil from "./pages/Perfil";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import AnunciarImovel from "./pages/AnunciarImovel";
import MeusImoveis from "./pages/MeusImoveis";
import EditarImovel from "./pages/EditarImovel";
import DetalhesImovel from "./pages/DetalhesImovel";
import Interessados from "./pages/Interessados";
import MeusInteresses from "./pages/MeusInteresses";
import Conversa from "./pages/Conversa";
import MinhasConversas from "./pages/MinhasConversas";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/busca" element={<Busca />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/imovel/:id" element={<DetalhesImovel />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/booking" element={<Booking />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/anunciar" element={<AnunciarImovel />} />
            <Route path="/meus-imoveis" element={<MeusImoveis />} />
            <Route path="/meus-imoveis/:id/editar" element={<EditarImovel />} />
            <Route path="/interessados" element={<Interessados />} />
            <Route path="/meus-interesses" element={<MeusInteresses />} />
            <Route path="/conversa/:id" element={<Conversa />} />
            <Route path="/conversas" element={<MinhasConversas />} />
          </Route>
        </Routes>

        <MenuInferior />
      </BrowserRouter>
    </AuthProvider>
  );
  
}

function MenuInferior() {
  const { pathname } = useLocation();

  if (["/login", "/cadastro"].includes(pathname)) {
    return null;
  }

  return <Tabs />;
}
