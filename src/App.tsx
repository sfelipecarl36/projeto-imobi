import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Busca from "./pages/Busca"
import Booking from "./pages/Booking"
import Perfil from "./pages/Perfil"

export default function App () {
   return (
    <>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home/>}></Route>
                <Route path="/busca" element={<Busca/>}></Route>
                <Route path="/booking" element={<Booking/>}></Route>
                <Route path="/perfil" element={<Perfil/>}></Route>
            </Routes>
        </BrowserRouter>
    </>
   )
}