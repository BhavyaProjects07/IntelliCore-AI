import os
import json
import csv
import requests
import tempfile
import docx
import pdfplumber
from bs4 import BeautifulSoup
from PIL import Image

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import (
    DocumentSerializer,
    SummarizationSessionSerializer,
    SummarizationMessageSerializer,
)
from .models import Document, SummarizationSession, SummarizationMessage

# ✅ Gemini
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# ---------------- TEXT EXTRACTION (Cloudinary URL) ---------------- #
def extract_text_from_file(file_url):
    ext = os.path.splitext(file_url)[-1].lower()
    text = ""

    try:
        # Download file from Cloudinary URL into temp file
        response = requests.get(file_url, stream=True)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_file.write(chunk)
            tmp_path = tmp_file.name

        if ext == ".pdf":
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

        elif ext == ".docx":
            doc = docx.Document(tmp_path)
            for para in doc.paragraphs:
                text += para.text + "\n"

        elif ext == ".csv":
            with open(tmp_path, newline="", encoding="utf-8", errors="ignore") as f:
                reader = csv.reader(f)
                for row in reader:
                    text += ", ".join(row) + "\n"

        elif ext == ".json":
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
                text = json.dumps(data, indent=2)

        elif ext in [".html", ".htm", ".xml"]:
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                soup = BeautifulSoup(f, "html.parser")
                text = soup.get_text(separator="\n")

        elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"]:
            # OCR for image files (can integrate pytesseract if needed)
            img = Image.open(tmp_path)
            text = "⚠️ OCR not implemented yet for images."

        else:  # fallback: plain text
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        os.remove(tmp_path)

    except Exception as e:
        text = f"⚠️ Error extracting text from {os.path.basename(file_url)}: {str(e)}"

    if not text.strip():
        text = f"⚠️ Could not extract readable text from {os.path.basename(file_url)}."

    return text.strip()


# ---------------- DOCUMENT UPLOAD ---------------- #
class DocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = DocumentSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            document = serializer.save(user=request.user)
            # ✅ Return Cloudinary URL instead of local path
            return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------- SUMMARIZE VIEW ---------------- #
class SummarizeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file_ids = request.data.get("files", [])
        if not isinstance(file_ids, list):
            return Response({"error": "files must be a list of IDs"}, status=400)

        try:
            file_ids = [int(fid) for fid in file_ids]
        except ValueError:
            return Response({"error": "Invalid file IDs"}, status=400)

        docs = Document.objects.filter(id__in=file_ids, user=request.user)
        if not docs.exists():
            return Response({"error": "No documents found"}, status=400)

        combined_text = "\n\n".join([extract_text_from_file(d.file.url) for d in docs])

        if not combined_text.strip():
            return Response(
                {"error": "No readable text could be extracted (scanned PDFs need OCR)."},
                status=400,
            )

        prompt = f"""
You are a professional document analyst. 
Summarize the following document(s) into a **highly detailed, well-structured Markdown report**.

⚠️ IMPORTANT: 
- Use clear markdown headers: `### 1. Overview`, `### 2. Important Details`, etc. 
- Always use bullet points (`- ...`) for lists, never long paragraphs. 
- Highlight key terms/dates/names in **bold**.
- Add line breaks between sections for readability.

Your output MUST strictly follow this structure:

### 1. Overview
(2–4 sentences max, in plain text.)

### 2. Important Details
- **Clause/Instruction** → explanation
- **Date/Name/Number** → explanation
- (Continue listing EVERYTHING important)

### 3. Context & Purpose
- Why the document exists
- Who it is for
- How it is used

### 4. Implications
- **Rule broken** → consequence
- **Missed requirement** → penalty

### 5. Extra Observations
- Errors, missing parts, inconsistencies
- Anything unusual or noteworthy

### 6. Verbatim Quotes
- "Copy key phrases here"
- "Use exact wording from the text"

---
📄 Document Content:
{combined_text[:12000]}
"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[types.Content(role="user", parts=[types.Part(text=prompt)])]
            )

            summary_text = getattr(response, "text", None)
            if not summary_text:
                return Response({"error": "Gemini returned no summary text."}, status=500)

            # ✅ Save summarization session
            first_doc = docs.first()
            session = SummarizationSession.objects.create(
                user=request.user,
                document=first_doc,
                title=f'Summarization "{os.path.basename(first_doc.file.name)}"',
                summary_text=summary_text,
            )
            SummarizationMessage.objects.create(session=session, role="assistant", content=summary_text)

            return Response({
                "summary": summary_text,
                "session_id": session.id,
                "title": session.title,
                "created_at": session.created_at,
            }, status=200)

        except Exception as e:
            return Response({"error": f"Gemini summarization failed: {str(e)}"}, status=500)


# ---------------- LIST SUMMARIZATIONS ---------------- #
class SummarizeListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = SummarizationSession.objects.filter(user=request.user).order_by("-created_at")
        serializer = SummarizationSessionSerializer(sessions, many=True)
        return Response(serializer.data, status=200)


# ---------------- CHAT WITH SUMMARY ---------------- #
class SummarizeChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        query = request.data.get("query", "").strip()
        if not query:
            return Response({"error": "Query cannot be empty."}, status=400)

        try:
            session = SummarizationSession.objects.get(id=session_id, user=request.user)
        except SummarizationSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

        # Build context with saved summary
        context_prompt = f"""
You are chatting with a user about a previously summarized document.

### Summary Context:
{session.summary_text}

### User Query:
{query}

Answer based ONLY on the summary context above. 
If the summary does not mention something, reply: "⚠️ Not available in the provided summary."
"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[types.Content(role="user", parts=[types.Part(text=context_prompt)])]
            )

            answer = getattr(response, "text", None) or "⚠️ Gemini returned no response."

            # Save chat messages
            SummarizationMessage.objects.create(session=session, role="user", content=query)
            SummarizationMessage.objects.create(session=session, role="assistant", content=answer)

            return Response({"reply": answer}, status=200)

        except Exception as e:
            return Response({"error": f"Gemini chat failed: {str(e)}"}, status=500)


# ---------------- AUDIO SUMMARIZATION ---------------- #
from gtts import gTTS
from django.conf import settings

class AudioSummarizeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = SummarizationSession.objects.get(id=session_id, user=request.user)
            text_summary = session.summary_text

            lang = request.data.get("language", "en")

            narration_prompt = f"""
                Rewrite the following summary into a natural, human-like spoken narration. 
                - Remove all markdown, symbols like ** or ##, and any formatting. 
                - Write in smooth, conversational { 'Hindi' if lang == 'hi' else 'English' }. 
                - Pretend you are narrating the content aloud for an audiobook.

                ### Original Summary:
                {text_summary}
            """

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[types.Content(role="user", parts=[types.Part(text=narration_prompt)])]
            )
            narration = response.text.strip()

            # ✅ Convert narration to audio
            tts = gTTS(narration, lang=lang)

            audio_dir = os.path.join(settings.MEDIA_ROOT, "audio")
            os.makedirs(audio_dir, exist_ok=True)
            file_path = os.path.join(audio_dir, f"summary_{session.id}_{lang}.mp3")

            tts.save(file_path)

            audio_url = request.build_absolute_uri(
                f"{settings.MEDIA_URL}audio/summary_{session.id}_{lang}.mp3"
            )

            return Response({"audio_url": audio_url, "narration": narration}, status=200)

        except SummarizationSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
