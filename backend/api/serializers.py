from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import User, Service, Appointment


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de novos usuários."""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer de leitura do usuário."""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role']
        read_only_fields = fields


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer para serviços."""

    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'duration_minutes', 'price', 'active']


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer para agendamentos com validação de conflito."""

    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    barber_name = serializers.CharField(source='barber.get_full_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'barber', 'service', 'date_time', 'end_time',
            'status', 'created_at', 'client_name', 'barber_name',
            'service_name', 'service_duration',
        ]
        read_only_fields = ['id', 'end_time', 'status', 'created_at', 'client']

    def validate_date_time(self, value):
        """Valida horário de funcionamento e data futura."""
        if value <= timezone.now():
            raise serializers.ValidationError('O horário deve ser no futuro.')

        if value.weekday() == 6:  # Domingo
            raise serializers.ValidationError('A barbearia não funciona aos domingos.')

        if value.hour < 9 or value.hour >= 18:
            raise serializers.ValidationError(
                'Horário fora do funcionamento (09:00 às 18:00).'
            )

        return value

    def validate(self, attrs):
        """Valida conflito de horário com outros agendamentos."""
        barber = attrs.get('barber')
        date_time = attrs.get('date_time')
        service = attrs.get('service')

        if barber and date_time and service:
            end_time = date_time + timedelta(minutes=service.duration_minutes)

            if end_time.hour > 18 or (end_time.hour == 18 and end_time.minute > 0):
                raise serializers.ValidationError(
                    'O serviço ultrapassaria o horário de funcionamento (18:00).'
                )

            conflicting = Appointment.objects.filter(
                barber=barber,
                status__in=['pending', 'confirmed'],
                date_time__lt=end_time,
                end_time__gt=date_time,
            )

            if self.instance:
                conflicting = conflicting.exclude(pk=self.instance.pk)

            if conflicting.exists():
                raise serializers.ValidationError(
                    'Já existe um agendamento neste horário para este barbeiro.'
                )

            if barber.role != 'barber':
                raise serializers.ValidationError(
                    'O profissional selecionado não é um barbeiro.'
                )

        return attrs
