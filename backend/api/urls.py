from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.me_view, name='me'),

    # Services & Barbers
    path('services/', views.ServiceListView.as_view(), name='service-list'),
    path('barbers/', views.BarberListView.as_view(), name='barber-list'),

    # Available slots
    path('appointments/available-slots/', views.available_slots, name='available-slots'),

    # Router (appointments CRUD)
    path('', include(router.urls)),
]
