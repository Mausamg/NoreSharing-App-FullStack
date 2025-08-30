from django.urls import path
from . import views

from myapp.views import (
    SendPasswordResetEmailView, UserChangePasswordView, UserLoginView,
    UserPasswordResetView, UserProfileView, UserRegistrationView, test_api,
    UserProfileDetailView, rate_note, bookmark_note, PublicUserProfileByUsername,
    AdminUsersView, AdminUserDetailView, HeartbeatView
)


urlpatterns=[
    path('test_api/', test_api, name='test_api'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', UserChangePasswordView.as_view(), name='changepassword'),
    path('send-reset-password-email/', SendPasswordResetEmailView.as_view(), name='send-reset-password-email'),
    path('reset-password/<uid>/<token>/', UserPasswordResetView.as_view(), name='reset-password'),


    # Create new note (with file/image) or get all notes
    path('notes/', views.notes, name='notes'),

    # Upload endpoint (optional if handled in `notes` view)
    path('notes/upload/', views.upload_note, name='upload_note'),

    # Specific endpoints must come BEFORE the slug route to avoid capture
    # Current user's notes and bookmarked
    path('notes/mine/', views.my_notes, name='my_notes'),
    path('notes/bookmarked/', views.bookmarked_notes, name='bookmarked_notes'),
    # Public notes by username/email
    path('notes/by-user/<str:username>/', views.notes_by_username, name='notes_by_username'),

    # Get, update, or delete a single note by slug
    path('notes/<slug:slug>/', views.note_detail, name='note_detail'),

    # Rate and bookmark endpoints
    path('notes/<slug:slug>/rate/', rate_note, name='rate_note'),
    path('notes/<slug:slug>/bookmark/', bookmark_note, name='bookmark_note'),

    path("search_notes/", views.search_notes, name="search_notes"),
    path("users/<int:user_id>/", UserProfileDetailView.as_view(), name="user-profile"),
    # public profile by username (email or display name)
    path("profile/<str:username>/", PublicUserProfileByUsername.as_view(), name="public-user-profile"),
    path("download/attachment/<int:pk>/", views.download_attachment, name="download_attachment"),
    # Admin user management
    path("admin/users/", AdminUsersView.as_view(), name="admin-users"),
    path("admin/users/<int:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    # Heartbeat
    path("heartbeat/", HeartbeatView.as_view(), name="heartbeat"),
]