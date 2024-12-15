import { Telegraf } from "telegraf";
import "dotenv/config";
import connectDb from "./config/db.js";
import { User } from "./model/userModel.js";
import { getNewNotices } from "./utils.js";
import express from "express";
import { Notice } from "./model/noticeModel.js";
const app = express();

const port = process.env.PORT || 3000;

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
      `🤠 Hello ${from.first_name}! You will now receive realtime updates from PTU Noticeboard.`
    );
  } catch (error) {
    console.error("[START_ERROR]", error);
    ctx.reply("Error while saving user data");
  }
});

bot.command("latest", async (ctx) => {
  // fetch first notice from db
  try {
    const latest_notice = await Notice.findOne({
      serialNumber: 1,
    });

    if (!latest_notice) {
      return ctx.reply("No notices available at the moment.");
    }

    ctx.reply(
      `📢 *New Notice | ${latest_notice.postedOn}* \n\n${latest_notice.title}\n\n🔗 ${latest_notice.downloadLink}`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.log("[LATEST_NOTICE_ERROR]", error);
  }
});

bot.command("latest5", async (ctx) => {
  // fetch first 5 notices from db
  try {
    const latest_notices = await Notice.find().limit(5);

    if (!latest_notices) {
      return ctx.reply("No notices available at the moment.");
    }

    for (const notice of latest_notices) {
      ctx.reply(
        `📢 *New Notice | ${notice.postedOn}* \n\n${notice.title}\n\n🔗 ${notice.downloadLink}`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (error) {
    console.log("[LATEST_NOTICE_ERROR]", error);
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

setInterval(fetchUpdates, 1000 * 60 * 10); // poll every 10 minutes

bot.launch();

app.get("/", (req, res) => {
  res.send("PTU NoticeBoard is active!");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
