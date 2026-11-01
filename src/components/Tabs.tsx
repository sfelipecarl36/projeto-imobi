import "..tailwind.css"
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
        <div className="flex items-center justify-around">
            {
                tabOptions.map((tab, index) => {
                    const Icone = tab.icone;

                    return(
                        <NavLink key={index} to={tab.rota} end={tab.rota==="/"} className={({ isActive }) => 
                        `flex flex-col items-center gap-1 transition-colors ${ isActive ? "text-green-500": "text-gray-400" }`
                        }>
                            {({ isActive }) => (
                            <>
                                <Icone size={24} strokeWidth={isActive ? 2.8 : 1.7 } fill={ isActive ? "currentColor" : "none" } />
                                <span className="text-[11px] font-medium">{tab.titulo}</span>
                            </>
                            )}
                        </NavLink>
                    )
                })
            }
            
        </div>
    )
}