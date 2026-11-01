import { Home, Search, Book, User } from "lucide-react"
import { NavLink } from "react-router-dom"

export default function Tabs() {

    const tabOptions = [
        {
            titulo: 'Início',
            rota: '/',
            icone: Home
        },
        {
            titulo: 'Busca',
            rota: '/busca',
            icone: Search 
        },
        {
            titulo: 'Booking',
            rota: '/booking',
            icone: Book
        },
        {
            titulo: 'Perfil',
            rota: '/perfil',
            icone: User
        }
    ]

        return (
        <nav className="fixed bottom-0 left-0 z-50 w-full bg-white border-t border-gray-100 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
            {tabOptions.map((tab) => {
            const Icone = tab.icone

            return (
                <NavLink
                key={tab.rota}
                to={tab.rota}
                end={tab.rota === "/"}
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 ${
                    isActive ? "text-green-500" : "text-gray-400"
                    }`
                }
                >
                <Icone size={24} />
                <span className="text-xs">
                    {tab.titulo}
                </span>
                </NavLink>
            )
            })}
        </div>
        </nav>
        )
}