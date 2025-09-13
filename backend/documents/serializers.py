from rest_framework import serializers
from .models import Document
import os

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "user", "file", "uploaded_at"]
        read_only_fields = ["user", "uploaded_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def validate_file(self, value):
        # ✅ Add all allowed extensions here
        allowed_extensions = [
            ".txt", ".pdf", ".docx", ".csv", ".json",
            ".html", ".htm", ".xml",
            ".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"
        ]
        ext = os.path.splitext(value.name)[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(f"❌ Unsupported file type: {ext}")
        return value



from rest_framework import serializers
from .models import SummarizationSession, SummarizationMessage

class SummarizationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SummarizationMessage
        fields = "__all__"

class SummarizationSessionSerializer(serializers.ModelSerializer):
    messages = SummarizationMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SummarizationSession
        fields = "__all__"
