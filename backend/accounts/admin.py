
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProfile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ("email", "username", "is_staff", "is_active", "date_joined")
    list_filter = ("is_staff", "is_active", "date_joined")
    search_fields = ("email", "username")
    ordering = ("-date_joined",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "api_calls_used", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "company_name")
    readonly_fields = ("api_calls_used", "created_at", "updated_at")
