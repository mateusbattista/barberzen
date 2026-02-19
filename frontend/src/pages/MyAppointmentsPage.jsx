import { useState, useEffect } from 'react'
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'
import api from '../services/api'

export default function MyAppointmentsPage() {
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchAppointments = () => {
        setLoading(true)
        api.get('/appointments/')
            .then(({ data }) => setAppointments(data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    const handleCancel = async (id) => {
        if (!window.confirm('Deseja realmente cancelar este agendamento?')) return
        try {
            await api.post(`/appointments/${id}/cancel/`)
            fetchAppointments()
        } catch (err) {
            alert(err.response?.data?.detail || 'Erro ao cancelar.')
        }
    }

    const formatDateTime = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    const statusLabel = {
        pending: 'Pendente',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado',
    }

    const statusClass = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        cancelled: 'status-cancelled',
    }

    if (loading) return <div className="loading">Carregando agendamentos...</div>

    return (
        <div className="page">
            <h2>Meus Agendamentos</h2>

            {appointments.length === 0 ? (
                <p className="empty-state">Você não tem agendamentos.</p>
            ) : (
                <div className="appointments-list">
                    {appointments.map((apt) => (
                        <div key={apt.id} className={`card appointment-card ${statusClass[apt.status]}`}>
                            <div className="appointment-info">
                                <h3>{apt.service_name}</h3>
                                <p><FiUser style={{ verticalAlign: 'middle', marginRight: 4 }} />Barbeiro: {apt.barber_name}</p>
                                <p><FiCalendar style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatDateTime(apt.date_time)}</p>
                                <p><FiClock style={{ verticalAlign: 'middle', marginRight: 4 }} />{apt.service_duration} min</p>
                                <span className={`badge ${statusClass[apt.status]}`}>
                                    {statusLabel[apt.status]}
                                </span>
                            </div>
                            {apt.status !== 'cancelled' && (
                                <div className="appointment-actions">
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleCancel(apt.id)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
