import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function SchedulePage() {
    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [barbers, setBarbers] = useState([])
    const [selectedService, setSelectedService] = useState('')
    const [selectedBarber, setSelectedBarber] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [slots, setSlots] = useState([])
    const [selectedSlot, setSelectedSlot] = useState('')
    const [loading, setLoading] = useState(false)
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        Promise.all([
            api.get('/services/'),
            api.get('/barbers/'),
        ]).then(([servicesRes, barbersRes]) => {
            setServices(servicesRes.data)
            setBarbers(barbersRes.data)
        })
    }, [])

    useEffect(() => {
        if (selectedBarber && selectedDate && selectedService) {
            setSlotsLoading(true)
            api.get('/appointments/available-slots/', {
                params: {
                    barber_id: selectedBarber,
                    date: selectedDate,
                    service_id: selectedService,
                },
            })
                .then(({ data }) => setSlots(data.slots))
                .catch(() => setSlots([]))
                .finally(() => setSlotsLoading(false))
        } else {
            setSlots([])
        }
        setSelectedSlot('')
    }, [selectedBarber, selectedDate, selectedService])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            await api.post('/appointments/', {
                barber: selectedBarber,
                service: selectedService,
                date_time: selectedSlot,
            })
            setSuccess('Agendamento criado com sucesso!')
            setTimeout(() => navigate('/my-appointments'), 1500)
        } catch (err) {
            const data = err.response?.data
            if (data && typeof data === 'object') {
                const messages = data.non_field_errors || Object.values(data).flat()
                setError(messages.join(' '))
            } else {
                setError('Erro ao criar agendamento.')
            }
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="page">
            <h2>Agendar Horário</h2>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="schedule-form">
                <div className="form-group">
                    <label htmlFor="service">Serviço</label>
                    <select id="service" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} required>
                        <option value="">Selecione um serviço</option>
                        {services.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} — {s.duration_minutes}min — R${parseFloat(s.price).toFixed(2)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="barber">Barbeiro</label>
                    <select id="barber" value={selectedBarber} onChange={(e) => setSelectedBarber(e.target.value)} required>
                        <option value="">Selecione um barbeiro</option>
                        {barbers.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.first_name} {b.last_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="date">Data</label>
                    <input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                        min={today} required />
                </div>

                {slotsLoading && <div className="loading-sm">Buscando horários...</div>}

                {slots.length > 0 && (
                    <div className="form-group">
                        <label>Horário disponível</label>
                        <div className="slots-grid">
                            {slots.map((slot) => (
                                <button
                                    key={slot.start}
                                    type="button"
                                    className={`slot-btn ${selectedSlot === slot.start ? 'selected' : ''}`}
                                    onClick={() => setSelectedSlot(slot.start)}
                                >
                                    {formatTime(slot.start)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedBarber && selectedDate && selectedService && !slotsLoading && slots.length === 0 && (
                    <p className="no-slots">Nenhum horário disponível nesta data.</p>
                )}

                <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={!selectedSlot || loading}
                >
                    {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
            </form>
        </div>
    )
}
