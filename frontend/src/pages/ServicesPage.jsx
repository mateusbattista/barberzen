import { useState, useEffect } from 'react'
import { FiClock } from 'react-icons/fi'
import api from '../services/api'

export default function ServicesPage() {
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/services/')
            .then(({ data }) => setServices(data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="loading">Carregando serviços...</div>

    return (
        <div className="page">
            <h2>Nossos Serviços</h2>
            <div className="services-grid">
                {services.map((service) => (
                    <div key={service.id} className="card service-card">
                        <h3>{service.name}</h3>
                        <p className="service-description">{service.description}</p>
                        <div className="service-details">
                            <span className="service-duration">
                                <FiClock style={{ verticalAlign: 'middle', marginRight: 4 }} />{service.duration_minutes} min
                            </span>
                            <span className="service-price">R$ {parseFloat(service.price).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
