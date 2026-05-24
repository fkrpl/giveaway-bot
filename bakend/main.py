import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import httpx
import os

from config import BOT_TOKEN, ADMIN_IDS, WEBAPP_URL
from database import (
    get_or_create_user, is_admin, create_contest, get_active_contests,
    get_contest, update_contest, delete_contest, add_required_channel,
    get_required_channels, remove_required_channel, join_contest,
    get_participants, get_participant_count, has_participated,
    select_winners, get_winners, get_all_users, create_broadcast,
    get_contest_stats, set_admin,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Giveaway Platform API")
    yield


app = FastAPI(title="Telegram Giveaway Platform", lifespan=lifespan)


# --- Pydantic Models ---

class UserCreate(BaseModel):
    telegram_id: int
    username: str = ""
    first_name: str = ""
    last_name: str = ""

class ContestCreate(BaseModel):
    title: str
    description: str = ""
    prize: str
    winner_count: int = 1
    end_date: str
    is_ad: bool = False
    ad_text: str = ""
    image_url: str = ""
    admin_telegram_id: int

class ContestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prize: Optional[str] = None
    winner_count: Optional[int] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None
    is_ad: Optional[bool] = None
    ad_text: Optional[str] = None
    image_url: Optional[str] = None

class ChannelAdd(BaseModel):
    contest_id: str
    channel_username: str
    channel_title: str

class JoinContest(BaseModel):
    contest_id: str
    telegram_id: int

class SelectWinners(BaseModel):
    contest_id: str
    admin_telegram_id: int

class BroadcastCreate(BaseModel):
    admin_telegram_id: int
    content: str


# --- Auth Helper ---

async def verify_admin(telegram_id: int) -> bool:
    if telegram_id in ADMIN_IDS:
        return True
    return await is_admin(telegram_id)


async def check_subscription(telegram_id: int, channel_username: str) -> bool:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {"chat_id": f"@{channel_username.lstrip('@')}", "user_id": telegram_id}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            data = resp.json()
            if data.get("ok"):
                status = data["result"]["status"]
                return status in ("member", "administrator", "creator")
    except Exception as e:
        logger.error(f"Subscription check error: {e}")
    return False


# --- API Routes ---

@app.get("/api/contests")
async def list_contests():
    contests = await get_active_contests()
    result = []
    for c in contests:
        count = await get_participant_count(c["id"])
        channels = await get_required_channels(c["id"])
        result.append({**c, "participant_count": count, "required_channels": channels})
    return result


@app.get("/api/contests/{contest_id}")
async def get_contest_detail(contest_id: str):
    contest = await get_contest(contest_id)
    if not contest:
        raise HTTPException(404, "Contest not found")
    count = await get_participant_count(contest_id)
    channels = await get_required_channels(contest_id)
    winners = await get_winners(contest_id)
    return {**contest, "participant_count": count, "required_channels": channels, "winners": winners}


@app.post("/api/contests")
async def api_create_contest(data: ContestCreate):
    if not await verify_admin(data.admin_telegram_id):
        raise HTTPException(403, "Not authorized")
    contest = await create_contest(
        title=data.title, description=data.description, prize=data.prize,
        winner_count=data.winner_count, end_date=data.end_date,
        created_by_telegram_id=data.admin_telegram_id,
        is_ad=data.is_ad, ad_text=data.ad_text, image_url=data.image_url,
    )
    return contest


@app.put("/api/contests/{contest_id}")
async def api_update_contest(contest_id: str, data: ContestUpdate):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    result = await update_contest(contest_id, **update_data)
    if not result:
        raise HTTPException(404, "Contest not found")
    return result


@app.delete("/api/contests/{contest_id}")
async def api_delete_contest(contest_id: str, admin_telegram_id: int):
    if not await verify_admin(admin_telegram_id):
        raise HTTPException(403, "Not authorized")
    await delete_contest(contest_id)
    return {"ok": True}


@app.get("/api/contests/{contest_id}/participants")
async def api_get_participants(contest_id: str, admin_telegram_id: int = 0):
    if not await verify_admin(admin_telegram_id):
        raise HTTPException(403, "Not authorized")
    return await get_participants(contest_id)


@app.get("/api/contests/{contest_id}/participant-count")
async def api_participant_count(contest_id: str):
    count = await get_participant_count(contest_id)
    return {"count": count}


@app.post("/api/contests/{contest_id}/join")
async def api_join_contest(contest_id: str, data: JoinContest):
    contest = await get_contest(contest_id)
    if not contest:
        raise HTTPException(404, "Contest not found")
    if not contest["is_active"]:
        raise HTTPException(400, "Contest is not active")

    if await has_participated(contest_id, data.telegram_id):
        raise HTTPException(400, "Already participating")

    channels = await get_required_channels(contest_id)
    unsubscribed = []
    for ch in channels:
        subbed = await check_subscription(data.telegram_id, ch["channel_username"])
        if not subbed:
            unsubscribed.append(ch)

    if unsubscribed:
        return {"status": "need_subscribe", "unsubscribed_channels": unsubscribed}

    result = await join_contest(contest_id, data.telegram_id)
    if not result:
        raise HTTPException(400, "Already participating")

    return {"status": "joined", "participant": result}


@app.post("/api/contests/{contest_id}/check-subscription")
async def api_check_subscription(contest_id: str, data: JoinContest):
    channels = await get_required_channels(contest_id)
    unsubscribed = []
    for ch in channels:
        subbed = await check_subscription(data.telegram_id, ch["channel_username"])
        if not subbed:
            unsubscribed.append(ch)
    if unsubscribed:
        return {"status": "need_subscribe", "unsubscribed_channels": unsubscribed}
    result = await join_contest(contest_id, data.telegram_id)
    if not result:
        raise HTTPException(400, "Already participating")
    return {"status": "joined", "participant": result}


@app.post("/api/contests/{contest_id}/select-winners")
async def api_select_winners(contest_id: str, data: SelectWinners):
    if not await verify_admin(data.admin_telegram_id):
        raise HTTPException(403, "Not authorized")
    contest = await get_contest(contest_id)
    if not contest:
        raise HTTPException(404, "Contest not found")
    winners = await select_winners(contest_id, contest["winner_count"])
    return {"winners": winners}


@app.get("/api/contests/{contest_id}/winners")
async def api_get_winners(contest_id: str):
    return await get_winners(contest_id)


@app.post("/api/channels")
async def api_add_channel(data: ChannelAdd, admin_telegram_id: int):
    if not await verify_admin(admin_telegram_id):
        raise HTTPException(403, "Not authorized")
    return await add_required_channel(data.contest_id, data.channel_username, data.channel_title)


@app.delete("/api/channels/{channel_id}")
async def api_remove_channel(channel_id: str, admin_telegram_id: int):
    if not await verify_admin(admin_telegram_id):
        raise HTTPException(403, "Not authorized")
    await remove_required_channel(channel_id)
    return {"ok": True}


@app.post("/api/users/register")
async def api_register_user(data: UserCreate):
    user = await get_or_create_user(
        telegram_id=data.telegram_id, username=data.username,
        first_name=data.first_name, last_name=data.last_name,
    )
    return user


@app.get("/api/users/check-participation")
async def api_check_participation(contest_id: str, telegram_id: int):
    participated = await has_participated(contest_id, telegram_id)
    return {"participated": participated}


@app.post("/api/broadcast")
async def api_broadcast(data: BroadcastCreate):
    if not await verify_admin(data.admin_telegram_id):
        raise HTTPException(403, "Not authorized")
    users = await get_all_users()
    sent = 0
    for u in users:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                    json={"chat_id": u["telegram_id"], "text": data.content, "parse_mode": "HTML"},
                )
                if resp.json().get("ok"):
                    sent += 1
        except Exception:
            pass
    await create_broadcast(data.admin_telegram_id, data.content, sent)
    return {"sent": sent, "total": len(users)}


@app.get("/api/stats")
async def api_stats(admin_telegram_id: int = 0):
    return await get_contest_stats()


# --- Serve Frontend ---
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
