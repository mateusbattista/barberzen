from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuário do sistema com role de cliente ou barbeiro."""

    ROLE_CHOICES = (
        ('client', 'Cliente'),
        ('barber', 'Barbeiro'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.get_full_name()} ({self.get_role_display()})'


class Service(models.Model):
    """Serviço oferecido pela barbearia."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    duration_minutes = models.PositiveIntegerField(help_text='Duração em minutos')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'services'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.duration_minutes}min - R${self.price})'


class Appointment(models.Model):
    """Agendamento de serviço."""

    STATUS_CHOICES = (
        ('pending', 'Pendente'),
        ('confirmed', 'Confirmado'),
        ('cancelled', 'Cancelado'),
    )

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='client_appointments',
        limit_choices_to={'role': 'client'},
    )
    barber = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='barber_appointments',
        limit_choices_to={'role': 'barber'},
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    date_time = models.DateTimeField()
    end_time = models.DateTimeField(editable=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['date_time']

    def save(self, *args, **kwargs):
        from datetime import timedelta
        self.end_time = self.date_time + timedelta(minutes=self.service.duration_minutes)
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f'{self.client.get_full_name()} - {self.service.name} '
            f'com {self.barber.get_full_name()} em {self.date_time:%d/%m/%Y %H:%M}'
        )
