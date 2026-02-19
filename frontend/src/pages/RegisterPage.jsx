import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GiScissors } from 'react-icons/gi'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
    const { register } = useAuth()
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'client',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await register(form)
        } catch (err) {
            const data = err.response?.data
            if (data && typeof data === 'object') {
                const messages = Object.values(data).flat().join(' ')
                setError(messages)
            } else {
                setError('Erro ao cadastrar. Tente novamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1><GiScissors style={{ verticalAlign: 'middle', marginRight: 8 }} />BarberZen</h1>
                <p className="auth-subtitle">Crie sua conta</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="first_name">Nome</label>
                            <input id="first_name" name="first_name" type="text" value={form.first_name}
                                onChange={handleChange} required placeholder="Seu nome" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="last_name">Sobrenome</label>
                            <input id="last_name" name="last_name" type="text" value={form.last_name}
                                onChange={handleChange} required placeholder="Seu sobrenome" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Usuário</label>
                        <input id="username" name="username" type="text" value={form.username}
                            onChange={handleChange} required placeholder="Escolha um nome de usuário" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <input id="email" name="email" type="email" value={form.email}
                            onChange={handleChange} required placeholder="seu@email.com" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Telefone</label>
                        <input id="phone" name="phone" type="text" value={form.phone}
                            onChange={handleChange} placeholder="(11) 99999-9999" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input id="password" name="password" type="password" value={form.password}
                            onChange={handleChange} required minLength={6} placeholder="Mínimo 6 caracteres" />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                    </button>
                </form>

                <p className="auth-footer">
                    Já tem conta? <Link to="/login">Faça login</Link>
                </p>
            </div>
        </div>
    )
}
