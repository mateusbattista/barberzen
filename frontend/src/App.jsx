import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { GiScissors } from 'react-icons/gi'
import { FiLogOut, FiCalendar, FiScissors, FiList } from 'react-icons/fi'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ServicesPage from './pages/ServicesPage'
import SchedulePage from './pages/SchedulePage'
import MyAppointmentsPage from './pages/MyAppointmentsPage'
import BarberAgendaPage from './pages/BarberAgendaPage'

function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <div className="loading">Carregando...</div>
    return user ? children : <Navigate to="/login" />
}

function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    if (!user) return null

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/"><GiScissors style={{ verticalAlign: 'middle', marginRight: 6 }} /> BarberZen</Link>
            </div>
            <div className="navbar-links">
                {user.role === 'client' && (
                    <>
                        <Link to="/services"><FiScissors style={{ verticalAlign: 'middle', marginRight: 4 }} />Serviços</Link>
                        <Link to="/schedule"><FiCalendar style={{ verticalAlign: 'middle', marginRight: 4 }} />Agendar</Link>
                        <Link to="/my-appointments"><FiList style={{ verticalAlign: 'middle', marginRight: 4 }} />Meus Agendamentos</Link>
                    </>
                )}
                {user.role === 'barber' && (
                    <Link to="/barber/agenda"><FiCalendar style={{ verticalAlign: 'middle', marginRight: 4 }} />Minha Agenda</Link>
                )}
            </div>
            <div className="navbar-user">
                <span>{user.first_name || user.username}</span>
                <button onClick={handleLogout} className="btn btn-sm btn-outline">
                    <FiLogOut style={{ verticalAlign: 'middle', marginRight: 4 }} />Sair
                </button>
            </div>
        </nav>
    )
}

function AppRoutes() {
    const { user, loading } = useAuth()

    if (loading) return <div className="loading">Carregando...</div>

    const homeRedirect = user
        ? user.role === 'barber' ? '/barber/agenda' : '/services'
        : '/login'

    return (
        <>
            <Navbar />
            <main className="container">
                <Routes>
                    <Route path="/login" element={user ? <Navigate to={homeRedirect} /> : <LoginPage />} />
                    <Route path="/register" element={user ? <Navigate to={homeRedirect} /> : <RegisterPage />} />
                    <Route path="/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
                    <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
                    <Route path="/my-appointments" element={<PrivateRoute><MyAppointmentsPage /></PrivateRoute>} />
                    <Route path="/barber/agenda" element={<PrivateRoute><BarberAgendaPage /></PrivateRoute>} />
                    <Route path="/" element={<Navigate to={homeRedirect} />} />
                </Routes>
            </main>
        </>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}
