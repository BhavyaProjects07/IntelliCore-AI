from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from gpt4all import GPT4All
import json

@csrf_exempt  # temporary for testing (later we’ll handle CSRF properly)
def chat_with_ai(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            user_input = data.get("prompt", "")

            if not user_input:
                return JsonResponse({"error": "No prompt provided"}, status=400)

            # Load model only when needed
            model = GPT4All("gpt4all-falcon")  # Use correct model name

            with model.chat_session():
                response = model.generate(user_input, max_tokens=200)

            return JsonResponse({"response": response})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)
