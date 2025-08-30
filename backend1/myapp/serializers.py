from rest_framework import serializers
from myapp.models import User, Note, NoteAttachment, NoteRating
from django.db.models import Avg, Count
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from myapp.utils import Util

class UserRegistrationSerializer(serializers.ModelSerializer):
  # We are writing this becoz we need confirm password field in our Registratin Request
  password2 = serializers.CharField(style={'input_type':'password'}, write_only=True)
  class Meta:
    model = User
    fields=['email', 'name', 'password', 'password2', 'tc']
    extra_kwargs={
      'password':{'write_only':True}
    }

  # Validating Password and Confirm Password while Registration
  def validate(self, attrs):
    password = attrs.get('password')
    password2 = attrs.get('password2')
    if password != password2:
      raise serializers.ValidationError("Password and Confirm Password doesn't match")
    return attrs

  def create(self, validate_data):
    return User.objects.create_user(**validate_data)

class UserLoginSerializer(serializers.ModelSerializer):
  email = serializers.EmailField(max_length=255)
  class Meta:
    model = User
    fields = ['email', 'password']

class UserProfileSerializer(serializers.ModelSerializer):
  notes_count = serializers.SerializerMethodField()
  notes = serializers.SerializerMethodField()
  online = serializers.SerializerMethodField()

  class Meta:
    model = User
    fields = [
  'id', 'email', 'name', 'bio', 'created_at', 'last_login', 'last_seen',
  'is_admin', 'is_active', 'online', 'notes_count', 'notes'
    ]

  def get_notes_count(self, obj):
    return Note.objects.filter(user=obj).count()

  def get_notes(self, obj):
    notes = Note.objects.filter(user=obj)
    # Pass request context so nested serializers can compute user-specific fields
    request = self.context.get('request')
    return NoteSerializer(notes, many=True, context={'request': request}).data

  def get_online(self, obj):
    from django.utils import timezone
    if not getattr(obj, 'last_seen', None):
      return False
    try:
      return (timezone.now() - obj.last_seen).total_seconds() < 120
    except Exception:
      return False


class UserProfileUpdateSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['name', 'email', 'bio']
    extra_kwargs = {
      'email': {'required': False},
      'name': {'required': False},
      'bio': {'required': False},
    }

class UserChangePasswordSerializer(serializers.Serializer):
  password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  class Meta:
    fields = ['password', 'password2']

  def validate(self, attrs):
    password = attrs.get('password')
    password2 = attrs.get('password2')
    user = self.context.get('user')
    if password != password2:
      raise serializers.ValidationError("Password and Confirm Password doesn't match")
    user.set_password(password)
    user.save()
    return attrs

class SendPasswordResetEmailSerializer(serializers.Serializer):
  email = serializers.EmailField(max_length=255)
  class Meta:
    fields = ['email']

  def validate(self, attrs):
    email = attrs.get('email')
    if User.objects.filter(email=email).exists():
      user = User.objects.get(email = email)
      uid = urlsafe_base64_encode(force_bytes(user.id))
      print('Encoded UID', uid)
      token = PasswordResetTokenGenerator().make_token(user)
      print('Password Reset Token', token)
      link = f"http://localhost:5173/reset-password/{uid}/{token}"
      print('Password Reset Link', link)
      # Send EMail
      body = 'Click Following Link to Reset Your Password '+link +" "
      " "

      data = {
        'subject':'Reset Your Password',
        'body':body,
        'to_email':user.email
      }
      Util.send_email(data)
      return attrs
    else:
      raise serializers.ValidationError('You are not a Registered User')

class UserPasswordResetSerializer(serializers.Serializer):
  password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
  class Meta:
    fields = ['password', 'password2']

  def validate(self, attrs):
    try:
      password = attrs.get('password')
      password2 = attrs.get('password2')
      uid = self.context.get('uid')
      token = self.context.get('token')
      if password != password2:
        raise serializers.ValidationError("Password and Confirm Password doesn't match")
      id = smart_str(urlsafe_base64_decode(uid))
      user = User.objects.get(id=id)
      if not PasswordResetTokenGenerator().check_token(user, token):
        raise serializers.ValidationError('Token is not Valid or Expired')
      user.set_password(password)
      user.save()
      return attrs
    except DjangoUnicodeDecodeError as identifier:
      PasswordResetTokenGenerator().check_token(user, token)
      raise serializers.ValidationError('Token is not Valid or Expired')
  
class NoteAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = NoteAttachment
        fields = ['id', 'file', 'file_url', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class NoteSerializer(serializers.ModelSerializer):
  attachments = NoteAttachmentSerializer(many=True, read_only=True)
  username = serializers.CharField(source='user.email', read_only=True)
  name = serializers.CharField(source='user.name', read_only=True)
  avg_rating = serializers.SerializerMethodField()
  ratings_count = serializers.SerializerMethodField()
  user_rating = serializers.SerializerMethodField()
  is_bookmarked = serializers.SerializerMethodField()

  class Meta:
    model = Note
    fields = ['id', 'title', 'body', 'slug', 'category', 'created_at', 'updated_at', 'attachments', 'username', 'name', 'avg_rating', 'ratings_count', 'user_rating', 'is_bookmarked']

    read_only_fields = ['slug', 'created_at', 'updated_at']

  def create(self, validated_data):
    # Attach the logged-in user
    request = self.context.get("request")
    validated_data["user"] = request.user
    return super().create(validated_data)

  def get_avg_rating(self, obj):
    agg = obj.ratings.aggregate(avg=Avg('value'))
    return round(agg['avg'], 1) if agg['avg'] is not None else None

  def get_ratings_count(self, obj):
    return obj.ratings.aggregate(cnt=Count('id'))['cnt'] or 0

  def get_user_rating(self, obj):
    request = self.context.get('request')
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
      return None
    r = obj.ratings.filter(user=user).first()
    return r.value if r else None

  def get_is_bookmarked(self, obj):
    request = self.context.get('request')
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
      return False
    return obj.bookmarks.filter(id=user.id).exists()


class NoteRatingSerializer(serializers.ModelSerializer):
  class Meta:
    model = NoteRating
    fields = ['value']
    extra_kwargs = {
      'value': {'min_value': 1, 'max_value': 5}
    }


# Admin-facing lightweight serializer for managing users
class AdminUserSerializer(serializers.ModelSerializer):
  notes_count = serializers.SerializerMethodField()
  online = serializers.SerializerMethodField()

  class Meta:
    model = User
    fields = [
      'id', 'email', 'name', 'is_admin', 'is_active', 'created_at', 'last_login', 'last_seen', 'online', 'notes_count'
    ]
    read_only_fields = ['id', 'email', 'created_at', 'last_login', 'last_seen', 'online', 'notes_count']

  def get_notes_count(self, obj):
    # Use annotated value if present to avoid N+1; fallback to query
    val = getattr(obj, 'notes_count', None)
    if isinstance(val, int):
      return val
    return Note.objects.filter(user=obj).count()

  def get_online(self, obj):
    from django.utils import timezone
    if not getattr(obj, 'last_seen', None):
      return False
    try:
      return (timezone.now() - obj.last_seen).total_seconds() < 120
    except Exception:
      return False


