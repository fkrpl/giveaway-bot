from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


async def get_or_create_user(telegram_id: int, username: str = "", first_name: str = "", last_name: str = ""):
    result = supabase.table("users").select("*").eq("telegram_id", telegram_id).maybeSingle().execute()
    if result.data:
        return result.data
    insert_result = supabase.table("users").insert({
        "telegram_id": telegram_id,
        "username": username,
        "first_name": first_name,
        "last_name": last_name or "",
    }).execute()
    return insert_result.data[0]


async def set_admin(telegram_id: int, is_admin: bool = True):
    result = supabase.table("users").select("*").eq("telegram_id", telegram_id).maybeSingle().execute()
    if result.data:
        supabase.table("users").update({"is_admin": is_admin}).eq("id", result.data["id"]).execute()
        return True
    return False


async def is_admin(telegram_id: int) -> bool:
    result = supabase.table("users").select("is_admin").eq("telegram_id", telegram_id).maybeSingle().execute()
    return result.data and result.data.get("is_admin", False)


async def create_contest(title: str, description: str, prize: str, winner_count: int, end_date: str,
                         created_by_telegram_id: int, is_ad: bool = False, ad_text: str = "", image_url: str = ""):
    user = await get_or_create_user(created_by_telegram_id)
    result = supabase.table("contests").insert({
        "title": title,
        "description": description,
        "prize": prize,
        "winner_count": winner_count,
        "end_date": end_date,
        "created_by": user["id"],
        "is_ad": is_ad,
        "ad_text": ad_text,
        "image_url": image_url,
    }).execute()
    return result.data[0]


async def get_active_contests():
    result = supabase.table("contests").select("*").eq("is_active", True).order("created_at", desc=True).execute()
    return result.data


async def get_contest(contest_id: str):
    result = supabase.table("contests").select("*").eq("id", contest_id).maybeSingle().execute()
    return result.data


async def update_contest(contest_id: str, **kwargs):
    result = supabase.table("contests").update(kwargs).eq("id", contest_id).execute()
    return result.data[0] if result.data else None


async def delete_contest(contest_id: str):
    supabase.table("contests").delete().eq("id", contest_id).execute()
    return True


async def add_required_channel(contest_id: str, channel_username: str, channel_title: str):
    result = supabase.table("required_channels").insert({
        "contest_id": contest_id,
        "channel_username": channel_username,
        "channel_title": channel_title,
    }).execute()
    return result.data[0]


async def get_required_channels(contest_id: str):
    result = supabase.table("required_channels").select("*").eq("contest_id", contest_id).execute()
    return result.data


async def remove_required_channel(channel_id: str):
    supabase.table("required_channels").delete().eq("id", channel_id).execute()
    return True


async def join_contest(contest_id: str, telegram_id: int):
    user = await get_or_create_user(telegram_id)
    existing = supabase.table("participants").select("*").eq("contest_id", contest_id).eq("user_id", user["id"]).maybeSingle().execute()
    if existing.data:
        return None
    result = supabase.table("participants").insert({
        "contest_id": contest_id,
        "user_id": user["id"],
        "telegram_id": telegram_id,
    }).execute()
    return result.data[0]


async def get_participants(contest_id: str):
    result = supabase.table("participants").select("*, users(*)").eq("contest_id", contest_id).execute()
    return result.data


async def get_participant_count(contest_id: str):
    result = supabase.table("participants").select("id", count="exact").eq("contest_id", contest_id).execute()
    return result.count


async def has_participated(contest_id: str, telegram_id: int):
    user = await get_or_create_user(telegram_id)
    result = supabase.table("participants").select("id").eq("contest_id", contest_id).eq("user_id", user["id"]).maybeSingle().execute()
    return result.data is not None


async def select_winners(contest_id: str, count: int):
    from random import sample
    participants = supabase.table("participants").select("user_id").eq("contest_id", contest_id).execute()
    if not participants.data:
        return []
    participant_ids = [p["user_id"] for p in participants.data]
    winner_ids = sample(participant_ids, min(count, len(participant_ids)))
    for wid in winner_ids:
        supabase.table("winners").insert({
            "contest_id": contest_id,
            "user_id": wid,
        }).execute()
    supabase.table("contests").update({"is_active": False}).eq("id", contest_id).execute()
    winners_data = []
    for wid in winner_ids:
        u = supabase.table("users").select("*").eq("id", wid).maybeSingle().execute()
        if u.data:
            winners_data.append(u.data)
    return winners_data


async def get_winners(contest_id: str):
    result = supabase.table("winners").select("*, users(*)").eq("contest_id", contest_id).execute()
    return result.data


async def get_all_users():
    result = supabase.table("users").select("telegram_id").execute()
    return result.data


async def create_broadcast(admin_telegram_id: int, content: str, sent_count: int = 0):
    admin = await get_or_create_user(admin_telegram_id)
    result = supabase.table("broadcast_messages").insert({
        "admin_id": admin["id"],
        "content": content,
        "sent_count": sent_count,
    }).execute()
    return result.data[0]


async def get_contest_stats():
    total_contests = supabase.table("contests").select("id", count="exact").execute()
    active_contests = supabase.table("contests").select("id", count="exact").eq("is_active", True).execute()
    total_users = supabase.table("users").select("id", count="exact").execute()
    total_participants = supabase.table("participants").select("id", count="exact").execute()
    return {
        "total_contests": total_contests.count,
        "active_contests": active_contests.count,
        "total_users": total_users.count,
        "total_participants": total_participants.count,
    }
