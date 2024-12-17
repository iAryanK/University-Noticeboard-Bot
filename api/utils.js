import * as cheerio from "cheerio";
import axios from "axios";
import { Notice } from "./model/noticeModel.js";

export async function fetchNotices() {
  try {
    const { data } = await axios.get("https://ptu.ac.in/noticeboard-main/");

    const $ = cheerio.load(data);

    const notices = [];

    // Extract notices
    $("#table1 tbody tr").each((index, element) => {
      if (index === 50) return false;

      const serialNumber = index + 1;
      const title = $(element).find("td").eq(0).text().trim();
      const postedOn = $(element).find("td").eq(1).text().trim();
      const downloadLink =
        $(element).find("td").eq(2).find("a").attr("href") || "";

      // Add the extracted data to the array
      notices.push({ serialNumber, title, postedOn, downloadLink });
    });

    return notices;
  } catch (error) {
    console.error("[FETCH_NOTICES_ERROR]", error.message);
    return [];
  }
}

export async function getNewNotices() {
  const updated_notices = await fetchNotices();

  const stored_notices = await Notice.find();

  const new_notices = updated_notices.filter((updated_notice) => {
    return !stored_notices.some(
      (stored_notice) => stored_notice.title === updated_notice.title
    );
  });

  if (new_notices.length) {
    await Notice.deleteMany({});
    await Notice.insertMany(updated_notices);
  }

  return new_notices;
}
