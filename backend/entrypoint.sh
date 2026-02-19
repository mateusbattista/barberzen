#!/bin/bash
set -e

echo "Aguardando PostgreSQL..."
while ! python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('postgres', 5432)); s.close()" 2>/dev/null; do
    sleep 1
done
echo "PostgreSQL conectado!"

echo "Gerando migrations..."
python manage.py makemigrations --noinput

echo "Aplicando migrations..."
python manage.py migrate --noinput

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "Criando dados iniciais..."
python manage.py shell -c "
from api.models import User, Service

# Criar superusuário se não existir
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@barberzen.com', 'admin123', role='barber')
    print('Superusuário admin criado')

# Criar barbeiro se não existir
if not User.objects.filter(username='barbeiro1').exists():
    barber = User.objects.create_user(
        'barbeiro1', 'barbeiro1@barberzen.com', 'barber123',
        first_name='João', last_name='Silva', role='barber'
    )
    print(f'Barbeiro criado: {barber.username}')

# Criar serviços padrão
services = [
    {'name': 'Corte de Cabelo', 'duration_minutes': 30, 'price': 35.00, 'description': 'Corte masculino tradicional'},
    {'name': 'Barba', 'duration_minutes': 20, 'price': 25.00, 'description': 'Aparar e modelar barba'},
    {'name': 'Corte + Barba', 'duration_minutes': 50, 'price': 55.00, 'description': 'Combo corte e barba'},
    {'name': 'Pigmentação', 'duration_minutes': 40, 'price': 45.00, 'description': 'Pigmentação capilar'},
]
for s in services:
    Service.objects.get_or_create(name=s['name'], defaults=s)
    print(f'Serviço: {s[\"name\"]}')
" 2>/dev/null || true

echo "Iniciando servidor..."
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
