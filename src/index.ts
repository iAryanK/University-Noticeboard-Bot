import { Telegraf } from "telegraf";
import "dotenv/config";
import connectDb from "./config/db.js";
import { User } from "./model/userModel.js";
import { getNewNotices } from "./utils.js";

const bot = new Telegraf(process.env.BOT_TOKEN!);

try {
  connectDb();
} catch (error) {
  console.error("[DB_ERROR]", error);
  process.kill(process.pid, "SIGTERM");
}

bot.start(async (ctx) => {
  const from = ctx.update.message.from;

  try {
    await User.findOneAndUpdate(
      { tgId: from.id },
      {
        $setOnInsert: {
          tgId: from.id,
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
          isBot: from.is_bot,
        },
      },
      { upsert: true, new: true }
    );

    await ctx.reply(
      `Hello ${from.first_name}! You will now receive realtime updates from PTU Noticeboard.`
    );
  } catch (error) {
    console.error("[START_ERROR]", error);
    ctx.reply("Error while saving user data");
  }
});

const fetchUpdates = async () => {
  try {
    const new_notices = await getNewNotices();
    if (!new_notices.length) return;

    const users = await User.find();
    for (const user of users) {
      for (const notice of new_notices) {
        bot.telegram.sendMessage(
          user.tgId,
          `📢 *New Notice | ${notice.postedOn}* \n\n${notice.title}\n\n🔗 ${notice.downloadLink}`,
          { parse_mode: "Markdown" }
        );
      }
    }
  } catch (err) {
    console.error("Error fetching API updates:", err);
  }
};

setInterval(fetchUpdates, 1000 * 30); // poll every 10 minutes

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
