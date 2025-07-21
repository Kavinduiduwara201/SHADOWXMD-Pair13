const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;
  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let RobinPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!RobinPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await RobinPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);
      RobinPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);
            const sessionPrabath = fs.readFileSync("./session/creds.json");

            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace(
              "https://mega.nz/file/",
              ""
            );

            const sid = '╭━━〔🔗 Pair Code Connected 〕━━╮\n✅ *Your WhatsApp is now linked successfully!*\n🛠️ _Deploy for Shadow XMD Bot to start..._\n💡 *Note:* Bot not connected yet.\n👨‍💻 *Developer:* 𝑲𝒂𝒗𝒊𝒏𝒅𝒖 𝑰𝒅𝒖𝒘𝒂𝒓𝒂 & 𝑰𝒔𝒉𝒂𝒏 𝑵𝒊𝒎𝒔𝒂𝒓𝒂\n📞 *Contact:* +94 770 051 298\n🔗 *GitHub Repo:* https://github.com/Kavinduiduwara201/SHADOWXMD-Pair\n📱 *Join Our WhatsApp Group:* https://chat.whatsapp.com/HRRkAxmbg2GGNWPfsX2Nfc\n\n╭━━〔🔗 සම්බන්ධතාවය සාර්ථකයි 〕━━╮\n✅ *ඔබේ WhatsApp Account එක සාර්ථකව සම්බන්ධ කර ඇත!*\n\n👉 ${string_session} 👈\n\n*This is the your Session ID, copy this id and paste into config.js file*`;
            const mg = `🚫⚠️ *Important Notice!* ⚠️🚫\n\n🔐 *Do NOT share this Season id with anyone!*\n🤖 It gives full access to your WhatsApp Bot.\n👁️ Keep it private and secure!\n🛡️ Unauthorized use may compromise your account.`;
            const dt = await RobinPairWeb.sendMessage(user_jid, {
              image: {
                url: "https://files.catbox.moe/1dlviy.png",
              },
              caption: sid,
            });
            const msg = await RobinPairWeb.sendMessage(user_jid, {
              text: string_session,
            });
            const msg1 = await RobinPairWeb.sendMessage(user_jid, { text: mg });
          } catch (e) {
            exec("pm2 restart prabath");
          }

          await delay(100);
          return await removeFile("./session");
          process.exit(0);
        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          RobinPair();
        }
      });
    } catch (err) {
      exec("pm2 restart Robin-md");
      console.log("service restarted");
      RobinPair();
      await removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }
  return await RobinPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart Robin");
});

module.exports = router;
