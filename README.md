<div align="center">

# ✂️ BarberZen

**Sistema de agendamento para barbearias**

![Stack](https://img.shields.io/badge/Backend-Django%20%2B%20DRF-092E20?style=flat-square&logo=django)
![Stack](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square&logo=react)
![Stack](https://img.shields.io/badge/Database-PostgreSQL%2015-4169E1?style=flat-square&logo=postgresql)
![Stack](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)

</div>

---

## Sobre o projeto

O **BarberZen** é uma aplicação web completa para gerenciamento de agendamentos de barbearia. Clientes podem visualizar serviços, escolher um barbeiro, selecionar uma data e horário disponível e acompanhar seus agendamentos. Barbeiros têm acesso a uma agenda diária para confirmar ou cancelar atendimentos.

### Funcionalidades

**Clientes**
- Cadastro e login com JWT
- Visualização do catálogo de serviços
- Agendamento com seleção de barbeiro, data e horário disponível
- Cancelamento de agendamentos

**Barbeiros**
- Visualização da agenda diária por data
- Confirmação e cancelamento de agendamentos

**Sistema**
- Detecção automática de conflitos de horário
- Respeito a horário de funcionamento (09h–18h) e domingo fechado
- Renovação automática de token JWT

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)

Não é necessário instalar Python, Node.js ou PostgreSQL localmente.

---

## Como rodar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/mateusbattista/barberzen.git
cd barberzen
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

> O arquivo `.env` já vem com valores padrão prontos para desenvolvimento local. Não é necessário alterar nada para rodar.

### 3. Suba os containers

```bash
docker compose up --build
```

Na primeira execução, o backend irá automaticamente:
- Aguardar o PostgreSQL inicializar
- Rodar as migrações do banco de dados
- Criar dados iniciais (usuários e serviços de exemplo)

### 4. Acesse a aplicação

| Serviço | URL |
|---|---|
| Frontend (app) | http://localhost |
| Django Admin | http://localhost/admin |
| API REST | http://localhost/api |

---

## Credenciais de acesso (dados iniciais)

| Usuário | Senha | Perfil |
|---|---|---|
| `admin` | `admin123` | Barbeiro + Admin Django |
| `barbeiro1` | `barber123` | Barbeiro |

Para criar um cliente, use a tela de **Cadastro** no próprio app.

---

## Serviços cadastrados automaticamente

| Serviço | Duração | Preço |
|---|---|---|
| Corte de Cabelo | 30 min | R$ 35,00 |
| Barba | 20 min | R$ 25,00 |
| Corte + Barba | 50 min | R$ 55,00 |
| Pigmentação | 40 min | R$ 45,00 |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + react-router-dom + Axios |
| Backend | Django 4.2 + Django REST Framework |
| Autenticação | JWT (djangorestframework-simplejwt) |
| Banco de dados | PostgreSQL 15 |
| Servidor frontend | Nginx (produção) |
| Servidor backend | Gunicorn |
| Containerização | Docker + Docker Compose |

---

## Estrutura do repositório

```
barberzen/
├── backend/          # API Django
│   ├── api/          # App principal (models, views, serializers)
│   ├── core/         # Configurações Django
│   ├── Dockerfile
│   └── entrypoint.sh # Script de inicialização do container
├── frontend/         # App React
│   ├── src/
│   │   ├── contexts/ # AuthContext (JWT)
│   │   ├── pages/    # Telas da aplicação
│   │   └── services/ # Cliente Axios
│   ├── Dockerfile
│   └── nginx.conf    # Servidor de produção
├── docker-compose.yml
└── .env
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `SECRET_KEY` | `django-insecure-...` | Chave secreta Django |
| `DEBUG` | `False` | Modo debug |
| `POSTGRES_DB` | `barberzen` | Nome do banco |
| `POSTGRES_USER` | `barberzen` | Usuário do banco |
| `POSTGRES_PASSWORD` | `barberzen123` | Senha do banco |
| `POSTGRES_HOST` | `postgres` | Host do banco (serviço Docker) |

> **Atenção:** Em produção, utilize valores seguros para `SECRET_KEY` e `POSTGRES_PASSWORD`.

---

## Comandos úteis

```bash
# Subir em background
docker compose up -d --build

# Ver logs do backend
docker compose logs -f backend

# Parar tudo
docker compose down

# Parar e remover o volume do banco (dados zerados)
docker compose down -v
```

---

<div align="center">
  Feito com ☕ e muito café
</div>
