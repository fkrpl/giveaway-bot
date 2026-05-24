import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("8911531425:AAHLGwnL_3e_LWcWSm1p8Umwzr6FaC-43lY", "")
SUPABASE_URL = os.getenv("https://rbqivknspltaupwkkqaf.supabase.co", "")
SUPABASE_ANON_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicWl2a25zcGx0YXVwd2trcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDAyOTksImV4cCI6MjA5NTIxNjI5OX0.YY6DK5rMVcIWqgeLQGQyj_YoT_IaPpJXWDWHnCZF04U", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicWl2a25zcGx0YXVwd2trcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY0MDI5OSwiZXhwIjoyMDk1MjE2Mjk5fQ.nQSoV79BXJ0vanGroQM2UJJOUVlFNlB45V7yTo_pQ9g", "")
ADMIN_IDS = [int(x.strip()) for x in os.getenv("8327380093", "").split(",") if x.strip()]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-app.onrender.com")
