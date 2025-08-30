from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import (
    BaseUserManager, AbstractBaseUser
)
from django.core.validators import MinValueValidator, MaxValueValidator

# ==============================
# Custom User Manager
# ==============================
class UserManager(BaseUserManager):
    def create_user(self, email, name, tc, password=None, password2=None):
        """
        Creates and saves a User with the given email, tc and password.
        """
        if not email:
            raise ValueError('Users must have an email address')

        user = self.model(
            email=self.normalize_email(email),
            name=name,
            tc=tc,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, tc, password=None):
        """
        Creates and saves a superuser with the given email, name, tc and password.
        """
        user = self.create_user(
            email,
            password=password,
            name=name,
            tc=tc,
        )
        user.is_admin = True
        user.save(using=self._db)
        return user
    

# ==============================
# Custom User Model
# ==============================
class User(AbstractBaseUser):
    email = models.EmailField(
        verbose_name='email address',
        max_length=255,
        unique=True,
    )
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True, null=True, default="")
    tc = models.BooleanField()
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Last activity timestamp updated by heartbeat endpoint
    last_seen = models.DateTimeField(null=True, blank=True, default=None)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'tc']

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        return self.is_admin

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        return True

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        return self.is_admin
    

# ==============================
# Notes & Attachments
# ==============================
def note_file_path(instance, filename):
    # Store files under note’s slug folder
    return f"notes/{instance.note.slug}/{filename}"


class Note(models.Model):
    CATEGORY_CHOICES = [
        ('PERSONAL', 'Personal'),
        ('WORK', 'Work'),
        ('SCHOOL', 'School'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    title = models.CharField(max_length=100)
    body = models.TextField()
    slug = models.SlugField(max_length=100, blank=True, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='PERSONAL')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Users can bookmark notes
    bookmarks = models.ManyToManyField('User', related_name='bookmarked_notes', blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            slug_base = slugify(self.title)
            slug = slug_base
            if Note.objects.filter(slug__startswith=slug_base).exists():
                slug = f"{slug_base}-{Note.objects.filter(slug__startswith=slug_base).count()}"
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class NoteAttachment(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to=note_file_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment for {self.note.title}"


class NoteRating(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_ratings')
    value = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('note', 'user')

    def __str__(self):
        return f"{self.user.email} rated {self.note.title}: {self.value}"
