from django.contrib import admin
from .models import User, Note, NoteAttachment
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin


# Inline for NoteAttachments (used inside NoteInline)
class NoteAttachmentInline(admin.TabularInline):
    model = NoteAttachment
    extra = 1
    fields = ('file', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


# Inline for Notes inside User admin
class NoteInline(admin.StackedInline):  # stacked gives more space for attachments
    model = Note
    extra = 0
    fields = ('title', 'category', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [NoteAttachmentInline]  # <-- this does not truly nest in Django default
    show_change_link = True  # allows editing note in a separate page

    # Note: Default Django admin does not support true nested inlines,
    # but show_change_link lets you quickly access the note page where attachments are managed.


class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'email', 'name', 'tc', 'is_admin', 'notes_count')
    list_filter = ('is_admin',)
    fieldsets = (
        ('User Credentials', {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name','tc')}),
        ('Permissions', {'fields': ('is_admin',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2','tc'),
        }),
    )
    search_fields = ('email','name')
    ordering = ('email','id')
    filter_horizontal = ()
    inlines = [NoteInline]

    def notes_count(self, obj):
        return obj.notes.count()
    notes_count.short_description = "Notes"


admin.site.register(User, UserAdmin)


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "user", "created_at", "updated_at")
    list_filter = ("category", "created_at")
    search_fields = ("title", "body")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [NoteAttachmentInline]


@admin.register(NoteAttachment)
class NoteAttachmentAdmin(admin.ModelAdmin):
    list_display = ("note", "file", "uploaded_at")
    list_filter = ("uploaded_at",)
