import logging
from datetime import timedelta, datetime

from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import User, Service, Appointment
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ServiceSerializer,
    AppointmentSerializer,
)

logger = logging.getLogger('api')


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """Cadastro de novo usuário."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        logger.info(f'Novo usuário cadastrado: {user.username} ({user.role})')


@api_view(['GET'])
def me_view(request):
    """Retorna dados do usuário autenticado."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ─── Services ────────────────────────────────────────────────────────────────

class ServiceListView(generics.ListAPIView):
    """Lista serviços ativos (público)."""

    queryset = Service.objects.filter(active=True)
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]


# ─── Barbers ─────────────────────────────────────────────────────────────────

class BarberListView(generics.ListAPIView):
    """Lista barbeiros (público)."""

    queryset = User.objects.filter(role='barber', is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


# ─── Appointments ────────────────────────────────────────────────────────────

class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet de agendamentos."""

    serializer_class = AppointmentSerializer
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'barber':
            qs = Appointment.objects.filter(barber=user)
        else:
            qs = Appointment.objects.filter(client=user)

        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                qs = qs.filter(date_time__date=date)
            except ValueError:
                pass

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs.select_related('client', 'barber', 'service')

    def perform_create(self, serializer):
        appointment = serializer.save(client=self.request.user)
        logger.info(
            f'Agendamento criado: {appointment.client.username} com '
            f'{appointment.barber.username} em {appointment.date_time}'
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar agendamento."""
        appointment = self.get_object()
        user = request.user

        if user.role == 'client' and appointment.client != user:
            return Response(
                {'detail': 'Você só pode cancelar seus próprios agendamentos.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == 'barber' and appointment.barber != user:
            return Response(
                {'detail': 'Você só pode cancelar agendamentos da sua agenda.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if appointment.status == 'cancelled':
            return Response(
                {'detail': 'Este agendamento já está cancelado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = 'cancelled'
        appointment.save()
        logger.info(f'Agendamento {appointment.id} cancelado por {user.username}')
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmar agendamento (somente barbeiro)."""
        appointment = self.get_object()

        if request.user.role != 'barber':
            return Response(
                {'detail': 'Somente barbeiros podem confirmar agendamentos.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if appointment.barber != request.user:
            return Response(
                {'detail': 'Você só pode confirmar agendamentos da sua agenda.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if appointment.status != 'pending':
            return Response(
                {'detail': 'Somente agendamentos pendentes podem ser confirmados.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = 'confirmed'
        appointment.save()
        logger.info(f'Agendamento {appointment.id} confirmado por {request.user.username}')
        return Response(AppointmentSerializer(appointment).data)


# ─── Available Slots ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_slots(request):
    """
    Retorna horários disponíveis para um barbeiro em uma data específica.
    Query params: barber_id, date (YYYY-MM-DD), service_id
    """
    barber_id = request.query_params.get('barber_id')
    date_str = request.query_params.get('date')
    service_id = request.query_params.get('service_id')

    if not all([barber_id, date_str, service_id]):
        return Response(
            {'detail': 'Parâmetros obrigatórios: barber_id, date, service_id'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        barber = User.objects.get(id=barber_id, role='barber')
    except User.DoesNotExist:
        return Response(
            {'detail': 'Barbeiro não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        service = Service.objects.get(id=service_id, active=True)
    except Service.DoesNotExist:
        return Response(
            {'detail': 'Serviço não encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'detail': 'Formato de data inválido. Use YYYY-MM-DD.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if date.weekday() == 6:
        return Response({'slots': []})

    existing = Appointment.objects.filter(
        barber=barber,
        date_time__date=date,
        status__in=['pending', 'confirmed'],
    ).order_by('date_time')

    slots = []
    current = timezone.make_aware(datetime.combine(date, datetime.min.time().replace(hour=9)))
    end_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time().replace(hour=18)))
    service_duration = timedelta(minutes=service.duration_minutes)

    while current + service_duration <= end_of_day:
        slot_end = current + service_duration

        conflict = existing.filter(
            date_time__lt=slot_end,
            end_time__gt=current,
        ).exists()

        is_past = current <= timezone.now()

        if not conflict and not is_past:
            slots.append({
                'start': current.isoformat(),
                'end': slot_end.isoformat(),
            })

        current += timedelta(minutes=30)

    return Response({'slots': slots})
