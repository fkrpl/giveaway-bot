import logging
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
from config import BOT_TOKEN, WEBAPP_URL, ADMIN_IDS
from database import (
    get_or_create_user, is_admin, get_active_contests, get_contest,
    get_participant_count, has_participated, get_winners, set_admin
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    await get_or_create_user(
        telegram_id=user.id,
        username=user.username or "",
        first_name=user.first_name or "",
        last_name=user.last_name or "",
    )
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🎁 Открыть конкурсы", web_app=WebAppInfo(url=f"{WEBAPP_URL}/miniapp"))]
    ])
    if user.id in ADMIN_IDS:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🎁 Открыть конкурсы", web_app=WebAppInfo(url=f"{WEBAPP_URL}/miniapp"))],
            [InlineKeyboardButton("⚙️ Админ панель", web_app=WebAppInfo(url=f"{WEBAPP_URL}/admin"))],
        ])
    await update.message.reply_text(
        "👋 Добро пожаловать в платформу конкурсов!\n\n"
        "Нажмите кнопку ниже, чтобы участвовать в розыгрышах призов!",
        reply_markup=keyboard,
    )


async def admin_panel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.id not in ADMIN_IDS and not await is_admin(user.id):
        await update.message.reply_text("❌ У вас нет доступа к админ панели.")
        return
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("⚙️ Админ панель", web_app=WebAppInfo(url=f"{WEBAPP_URL}/admin"))]
    ])
    await update.message.reply_text("🔧 Админ панель:", reply_markup=keyboard)


async def contests_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contests = await get_active_contests()
    if not contests:
        await update.message.reply_text("📭 Сейчас нет активных конкурсов.")
        return
    for c in contests:
        count = await get_participant_count(c["id"])
        winners_str = ""
        winners = await get_winners(c["id"])
        if winners:
            winners_str = "\n🏆 Победители: " + ", ".join(
                f"@{w['users']['username']}" if w['users'].get('username') else w['users']['first_name']
                for w in winners
            )
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🎁 Участвовать", web_app=WebAppInfo(url=f"{WEBAPP_URL}/miniapp?contest={c['id']}"))]
        ])
        await update.message.reply_text(
            f"🎁 *{c['title']}*\n\n"
            f"📝 {c['description']}\n\n"
            f"🏆 Приз: {c['prize']}\n"
            f"👥 Участников: {count}\n"
            f"🎯 Победителей: {c['winner_count']}\n"
            f"⏰ Окончание: {c['end_date'][:16]}{winners_str}",
            parse_mode="Markdown",
            reply_markup=keyboard,
        )


async def make_admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.id not in ADMIN_IDS:
        await update.message.reply_text("❌ Нет прав.")
        return
    if not context.args:
        await update.message.reply_text("Использование: /makeadmin <telegram_id>")
        return
    target_id = int(context.args[0])
    await set_admin(target_id, True)
    await update.message.reply_text(f"✅ Пользователь {target_id} теперь админ.")


def run_bot():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("admin", admin_panel))
    app.add_handler(CommandHandler("contests", contests_command))
    app.add_handler(CommandHandler("makeadmin", make_admin))
    logger.info("Bot starting...")
    app.run_polling()


if __name__ == "__main__":
    run_bot()
