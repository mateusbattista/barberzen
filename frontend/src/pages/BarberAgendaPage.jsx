import { useState, useEffect } from 'react'
import { FiUser } from 'react-icons/fi'
import api from '../services/api'

export default function BarberAgendaPage() {
    const [appointments, setAppointments] = useState([])
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    )
    const [loading, setLoading] = useState(true)

    const fetchAppointments = () => {
        setLoading(true)
        api.get('/appointments/', { params: { date: selectedDate } })
            .then(({ data }) => setAppointments(data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchAppointments()
    }, [selectedDate])

    const handleConfirm = async (id) => {
        try {
            await api.post(`/appointments/${id}/confirm/`)
            fetchAppointments()
        } catch (err) {
            alert(err.response?.data?.detail || 'Erro ao confirmar.')
        }
    }

    const handleCancel = async (id) => {
        if (!window.confirm('Deseja realmente cancelar este agendamento?')) return
        try {
            await api.post(`/appointments/${id}/cancel/`)
            fetchAppointments()
        } catch (err) {
            alert(err.response?.data?.detail || 'Erro ao cancelar.')
        }
    }

    const formatTime = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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

    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        })
    }

    return (
        <div className="page">
            <h2>Minha Agenda</h2>

            <div className="agenda-header">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-picker"
                />
                <p className="date-display">{formatDateDisplay(selectedDate)}</p>
            </div>

            {loading ? (
                <div className="loading">Carregando agenda...</div>
            ) : appointments.length === 0 ? (
                <p className="empty-state">Nenhum agendamento para esta data.</p>
            ) : (
                <div className="agenda-list">
                    {appointments.map((apt) => (
                        <div key={apt.id} className={`card agenda-card ${statusClass[apt.status]}`}>
                            <div className="agenda-time">
                                <span className="time">{formatTime(apt.date_time)}</span>
                                <span className="time-end">até {formatTime(apt.end_time)}</span>
                            </div>
                            <div className="agenda-info">
                                <h3>{apt.service_name}</h3>
                                <p><FiUser style={{ verticalAlign: 'middle', marginRight: 4 }} />{apt.client_name}</p>
                                <span className={`badge ${statusClass[apt.status]}`}>
                                    {statusLabel[apt.status]}
                                </span>
                            </div>
                            <div className="agenda-actions">
                                {apt.status === 'pending' && (
                                    <>
                                        <button className="btn btn-success btn-sm" onClick={() => handleConfirm(apt.id)}>
                                            Confirmar
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(apt.id)}>
                                            Cancelar
                                        </button>
                                    </>
                                )}
                                {apt.status === 'confirmed' && (
                                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(apt.id)}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
