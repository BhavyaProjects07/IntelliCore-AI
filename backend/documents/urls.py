# documents/urls.py

from django.urls import path
from documents.views import DocumentUploadView, SummarizeView, SummarizeListView, SummarizeChatView

urlpatterns = [
    path("upload/", DocumentUploadView.as_view(), name="upload"),
    path("summarize/", SummarizeView.as_view(), name="summarize"),
    path("summaries/", SummarizeListView.as_view(), name="summaries"),
    path("summaries/<int:session_id>/chat/", SummarizeChatView.as_view(), name="summarization-chat"),
]
