const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const https = require("https");

const ALLOWED_USER_ID = "509043373504462878";
const BASE_DIR = "/home/kmf/websites/fujiwaratofu.shop/leaks/images";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("upload-leak")
    .setDescription("Store an attachment on the server (owner only)")
    .addAttachmentOption((opt) =>
      opt.setName("attachment").setDescription("File to save").setRequired(true)
    )
    .addUserOption((opt) =>
      opt.setName("target").setDescription("Assign to which user").setRequired(true)
    ),
  async execute(interaction) {
    if (interaction.user.id !== ALLOWED_USER_ID) {
      return interaction.reply({
        content: "You are not allowed to use this command.",
        flags: 64, // ephemeral
      });
    }

    const attachment = interaction.options.getAttachment("attachment");
    const target = interaction.options.getUser("target");

    if (!attachment) {
      return interaction.reply({
        content: "No attachment found.",
        flags: 64, // ephemeral
      });
    }

    const usernameSafe = target.username.replace(/[\/\\<>:"|?*\x00-\x1F]/g, "_");
    const userDir = path.join(BASE_DIR, usernameSafe);
    await fs.promises.mkdir(userDir, { recursive: true });

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const timeStamp = `${hh}:${mm}:${ss} ${dd}.${MM}.${yyyy}`;

    const url = attachment.url;
    let ext = path.extname(new URL(url).pathname) || ".png";
    if (!ext) ext = ".png";
    const filename = `${timeStamp}${ext}`;
    const filepath = path.join(userDir, filename);

    const downloadWithFetch = async (url, dest) => {
      if (typeof fetch === "function") {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Download failed");
        const buffer = Buffer.from(await res.arrayBuffer());
        await fs.promises.writeFile(dest, buffer);
        return;
      }
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https
          .get(url, (res) => {
            if (res.statusCode !== 200) {
              reject(new Error("Download failed, status " + res.statusCode));
              return;
            }
            res.pipe(file);
            file.on("finish", () => file.close(resolve));
          })
          .on("error", (err) => {
            fs.unlink(dest, () => {});
            reject(err);
          });
      });
    };

    try {
      await downloadWithFetch(url, filepath);
      await interaction.reply({
        content: `File saved: \`${path.join("images", usernameSafe, filename)}\``,
        flags: 64, // ephemeral
      });
    } catch (e) {
      console.error(e);
      await interaction.reply({
        content: "Error saving file.",
        flags: 64, // ephemeral
      });
    }
  },
};