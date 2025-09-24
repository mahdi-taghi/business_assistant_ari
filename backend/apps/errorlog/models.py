from django.db import models

# Create your models here.

class ErrorLog(models.Model):
    LEVEL_CHOICES = [
        ("DEBUG", "Debug"),
        ("INFO", "Info"),
        ("WARNING", "Warning"),
        ("ERROR", "Error"),
        ("CRITICAL", "Critical"),
    ]

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="ERROR")
    message = models.TextField()
    traceback = models.TextField(blank=True, null=True)
    request_path = models.CharField(max_length=255, blank=True, null=True)
    method = models.CharField(max_length=10, blank=True, null=True)
    user = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    logger_name = models.CharField(max_length=100, blank=True, null=True)
    function_name = models.CharField(max_length=100, blank=True, null=True)
    line_number = models.IntegerField(null=True, blank=True)
    extra_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['level']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.level} - {self.created_at}: {self.message[:100]}"