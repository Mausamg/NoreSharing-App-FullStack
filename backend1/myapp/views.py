import os
from django.http import JsonResponse, HttpResponse
from rest_framework.response import Response
from rest_framework import status,viewsets,permissions
from rest_framework.views import APIView
from myapp.serializers import (
    SendPasswordResetEmailSerializer, 
    UserChangePasswordSerializer, 
    UserLoginSerializer, 
    UserPasswordResetSerializer, 
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer
)
from django.contrib.auth import authenticate
from myapp.renderers import UserRenderer
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import Note, NoteAttachment, User, NoteRating
from .serializers import NoteSerializer, NoteRatingSerializer, AdminUserSerializer
from django.db.models import Avg, Count
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from rest_framework.permissions import AllowAny
from django.db.models import Q
from rest_framework.permissions import BasePermission
from django.utils import timezone
# =====================
# JWT Token Helper
# =====================
def get_tokens_for_user(user):
    if not user.is_active:
        raise AuthenticationFailed("User is not active")

    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# =====================
# Test Endpoints
# =====================
def home(request):
    return HttpResponse("Hello, Django!")

def test_api(request):
    return JsonResponse({"message": "Hello from django backend!"})


# =====================
# Auth Views
# =====================
class UserRegistrationView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = get_tokens_for_user(user)
        return Response({'token': token, 'msg': 'Registration Successful'}, status=status.HTTP_201_CREATED)
  

class UserLoginView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.data.get('email')
        password = serializer.data.get('password')
        user = authenticate(email=email, password=password)
        if user is not None:
            # Record last login time for admin dashboard
            try:
                user.last_login = timezone.now()
                user.save(update_fields=["last_login"])
            except Exception:
                pass
            token = get_tokens_for_user(user)
            return Response({
                'token': token,
                'email': user.email,
                'name': user.name,
                'is_admin': user.is_admin,
                'is_active': user.is_active,
                'msg': 'Login Success'
            }, status=status.HTTP_200_OK)
        else:
            return Response({'errors': {'non_field_errors': ['Email or Password is not Valid']}}, status=status.HTTP_404_NOT_FOUND)


class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, format=None):
        serializer = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # return the full profile after update
        out = UserProfileSerializer(request.user, context={"request": request})
        return Response(out.data, status=status.HTTP_200_OK)


# ===== Admin-only user management =====
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # By default show users who have logged in at least once
        show_all = request.query_params.get('all') in ['1', 'true', 'True']
        base = User.objects.all()
        # Annotate total notes per user
        base = base.annotate(notes_count=Count('notes'))
        if show_all:
            qs = base.order_by('-last_login', '-created_at')
        else:
            qs = base.filter(last_login__isnull=False).order_by('-last_login', '-created_at')
        data = AdminUserSerializer(qs, many=True).data
        return Response(data)


class HeartbeatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.last_seen = timezone.now()
            request.user.save(update_fields=['last_seen'])
            return Response({
                'ok': True,
                'last_seen': request.user.last_seen,
            })
        except Exception as e:
            return Response({'ok': False, 'error': str(e)}, status=500)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        def parse_bool(val):
            if isinstance(val, bool):
                return val
            if isinstance(val, (int, float)):
                return bool(val)
            if isinstance(val, str):
                return val.strip().lower() in ['1', 'true', 't', 'yes', 'y']
            return bool(val)

        is_admin = request.data.get('is_admin', None)
        is_active = request.data.get('is_active', None)

        # Prevent self-demotion or self-deactivation
        if user.id == request.user.id:
            if is_admin is not None and not bool(is_admin):
                return Response({"detail": "You cannot revoke your own admin role."}, status=400)
            if is_active is not None and not bool(is_active):
                return Response({"detail": "You cannot deactivate your own account."}, status=400)

        if is_admin is not None:
            user.is_admin = parse_bool(is_admin)
        if is_active is not None:
            user.is_active = parse_bool(is_active)
        user.save(update_fields=['is_admin', 'is_active'])
        return Response(AdminUserSerializer(user).data)

    def delete(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        if user.id == request.user.id:
            return Response({"detail": "You cannot delete your own account."}, status=400)
        user.delete()
        return Response(status=204)
  

class UserChangePasswordView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = UserChangePasswordSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password Changed Successfully'}, status=status.HTTP_200_OK)
  

class SendPasswordResetEmailView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = SendPasswordResetEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password Reset link sent. Please check your Email'}, status=status.HTTP_200_OK)


class UserPasswordResetView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, uid, token, format=None):
        serializer = UserPasswordResetSerializer(data=request.data, context={'uid': uid, 'token': token})
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password Reset Successfully'}, status=status.HTTP_200_OK)
  

# =====================
# Notes Endpoints
# =====================

@api_view(['GET']) 
def search_notes(request):
    query = request.GET.get('q', '').strip()

    try:
        if not query:
            return Response([])

        filters = Q(title__icontains=query) | Q(body__icontains=query)

        if 'category' in [f.name for f in Note._meta.get_fields()]:
            filters |= Q(category__icontains=query)

        if 'attachment' in [f.name for f in Note._meta.get_fields()]:
            filters |= Q(attachment__icontains=query)

        # ✅ Restrict search to logged-in user
        notes = Note.objects.filter(filters, user=request.user).order_by('-id')[:10]

        result_data = [
            {
                "id": note.id,
                "title": note.title,
                "body_snippet": note.body[:50]  # first 50 chars
            }
            for note in notes
        ]
        return Response(result_data)

    except Exception as e:
        print("SearchNotes Error:", e)
        return Response({"error": "Something went wrong"}, status=500)
    

# 📒 List / Create Notes
@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([AllowAny])  # ✅ Important: allows public GET
def notes(request):
    if request.method == 'GET':
        # Anyone can fetch notes
        notes_qs = (
            Note.objects.all()
            .order_by('-updated_at', '-created_at', '-id')
            .prefetch_related('attachments', 'bookmarks', 'ratings')
        )
        serializer = NoteSerializer(notes_qs, many=True, context={'request': request})
        return Response(serializer.data)

    # POST
    # Log Authorization header for debugging
    auth_header = request.headers.get('Authorization', None)
    print("Authorization header:", auth_header)

    # Only logged-in users can create notes
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required to create notes."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    print("Incoming request data:", request.data)  # Log incoming request data
    serializer = NoteSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        note = serializer.save(user=request.user)

        # Process file uploads
        files = request.FILES.getlist('attachments')
        for file in files:
            NoteAttachment.objects.create(note=note, file=file)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    print("Validation errors:", serializer.errors)  # Log validation errors
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 📒 Detail / Update / Delete Note

@api_view(['GET', 'PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser])
def note_detail(request, slug):
    try:
        note = Note.objects.get(slug=slug)
    except Note.DoesNotExist:
        print("Note not found for slug:", slug)  # Log slug for debugging
        return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

    # -------------------------
    # PUBLIC: Anyone can view
    # -------------------------
    if request.method == 'GET':
        serializer = NoteSerializer(note, context={'request': request})
        return Response(serializer.data)

    # -------------------------
    # PROTECTED: Only owner can edit/delete
    # -------------------------
    if not request.user.is_authenticated:
        print("Unauthenticated user attempted to modify note")  # Log unauthenticated access
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    if note.user != request.user and not getattr(request.user, 'is_admin', False):
        print("Permission denied for user:", request.user)  # Log user details
        return Response({"error": "You do not have permission to modify this note"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        try:
            print("Incoming request data:", request.data)  # Log incoming request data
            print("Incoming files:", request.FILES)  # Log incoming files

            # Parse incoming existingAttachments (sent as JSON string)
            # Client may send a list of ids like [1,2] or a list of dicts [{id:1}, ...].
            existing_attachments_raw = request.data.get('existingAttachments')
            keep_ids = None  # None means client didn't provide the field
            if existing_attachments_raw is not None:
                try:
                    import json
                    existing_list = json.loads(existing_attachments_raw)
                    keep_ids = set()
                    for item in existing_list:
                        if isinstance(item, int):
                            keep_ids.add(int(item))
                        elif isinstance(item, dict) and item.get('id'):
                            keep_ids.add(int(item.get('id')))
                except Exception as e:
                    print('Failed to parse existingAttachments:', e)

            # Update fields manually to avoid serializer complaining about extra fields
            title = request.data.get('title')
            body = request.data.get('body')
            category = request.data.get('category')

            if title is not None:
                note.title = title
            if body is not None:
                note.body = body
            if category is not None:
                note.category = category

            note.save()

            # Delete attachments that are not in keep_ids
            current_attachments = list(note.attachments.all())
            for att in current_attachments:
                # If keep_ids is None -> client didn't send the field, so don't delete anything.
                # If keep_ids is an explicit set (possibly empty) -> delete attachments not present in keep_ids.
                if keep_ids is not None and att.id not in keep_ids:
                    # delete file from storage
                    try:
                        if att.file and hasattr(att.file, 'path') and os.path.exists(att.file.path):
                            os.remove(att.file.path)
                    except Exception as e:
                        print('Failed to remove file from storage:', e)
                    att.delete()

            # Handle new uploaded files
            files = request.FILES.getlist('attachments')
            for f in files:
                NoteAttachment.objects.create(note=note, file=f)

            serializer = NoteSerializer(note, context={'request': request})
            print("Updated note:", note)  # Log updated note
            return Response(serializer.data)

        except Exception as exc:
            import traceback
            tb = traceback.format_exc()
            print('Exception during note update:', exc)
            print(tb)
            return Response({'error': 'Internal Server Error', 'details': str(exc)}, status=500)

    elif request.method == 'DELETE':
        note.delete()
        print("Note deleted successfully")  # Log deletion
        return Response(status=status.HTTP_204_NO_CONTENT)


# ⭐ Rate a note (create/update/delete user rating)
@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def rate_note(request, slug):
    note = get_object_or_404(Note, slug=slug)
    if request.method == 'DELETE':
        NoteRating.objects.filter(note=note, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = NoteRatingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    value = serializer.validated_data['value']
    rating, created = NoteRating.objects.update_or_create(
        note=note, user=request.user, defaults={'value': value}
    )
    # return updated aggregates
    payload = NoteSerializer(note, context={'request': request}).data
    return Response(payload, status=status.HTTP_200_OK)


# 🔖 Bookmark a note (toggle)
@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def bookmark_note(request, slug):
    note = get_object_or_404(Note, slug=slug)
    if request.method == 'DELETE':
        note.bookmarks.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
    note.bookmarks.add(request.user)
    payload = NoteSerializer(note, context={'request': request}).data
    return Response(payload, status=status.HTTP_200_OK)


# 📂 Upload Note with Attachments
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_note(request):
    serializer = NoteSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        note = serializer.save(user=request.user)  # ✅ attach note to user

        files = request.FILES.getlist('attachments')
        for f in files:
            NoteAttachment.objects.create(note=note, file=f)

        serializer = NoteSerializer(note, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]  # only logged-in users

    def get_queryset(self):
        # ✅ only return notes of the logged-in user
        return Note.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # ✅ attach user automatically
        serializer.save(user=self.request.user)

# view another user's profile by id
class UserProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        try:
            user = User.objects.prefetch_related("notes").get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserProfileSerializer(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

# Public profile by username/email (read-only)
class PublicUserProfileByUsername(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username, format=None):
        try:
            user = User.objects.get(Q(email=username) | Q(name=username))
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserProfileSerializer(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# 🧑‍💻 Current user's notes
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_notes(request):
    notes_qs = (
        Note.objects.filter(user=request.user)
        .order_by('-updated_at', '-created_at', '-id')
        .prefetch_related("attachments", "bookmarks", "ratings")
    )
    serializer = NoteSerializer(notes_qs, many=True, context={"request": request})
    return Response(serializer.data)


# 🌐 Public: notes by username/email
@api_view(["GET"])
@permission_classes([AllowAny])
def notes_by_username(request, username):
    try:
        user = User.objects.get(Q(email=username) | Q(name=username))
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    notes_qs = (
        Note.objects.filter(user=user)
        .order_by('-updated_at', '-created_at', '-id')
        .prefetch_related("attachments", "bookmarks", "ratings")
    )
    serializer = NoteSerializer(notes_qs, many=True, context={"request": request})
    return Response(serializer.data)
    
def download_attachment(request, pk):
    attachment = get_object_or_404(NoteAttachment, pk=pk)
    if not attachment.file:
        raise Http404("No file attached")

    file_path = attachment.file.path
    if not os.path.exists(file_path):
        raise Http404("File not found")

    response = FileResponse(open(file_path, 'rb'), as_attachment=True)
    # Optionally set filename in Content-Disposition
    response["Content-Disposition"] = f'attachment; filename="{os.path.basename(file_path)}"'
    return response


# 🔖 Current user's bookmarked notes
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bookmarked_notes(request):
    notes_qs = (
        Note.objects.filter(bookmarks=request.user)
        .order_by('-updated_at', '-created_at', '-id')
        .prefetch_related("attachments", "bookmarks", "ratings")
    )
    serializer = NoteSerializer(notes_qs, many=True, context={"request": request})
    return Response(serializer.data)