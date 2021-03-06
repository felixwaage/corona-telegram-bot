const telegramAPI = require("node-telegram-bot-api");
const Request = require("request");
const storage = require("node-persist");
const cron = require("cron");
const log = require("simple-node-logger").createSimpleLogger("project.log");

const token = "1774101462:AAFYCaP1E1ACbCeNwd_LwdznBSWSlUrREnk";

const bot = new telegramAPI(token, {
  polling: true,
});

var checkJob = new cron.CronJob("0 0 9 * * *", () => {
  log.info("Scheduled Job Running...");
});

main();

async function main() {
  log.info("Welcome to Corona Telegram Bot by Felix");
  //console.log("Welcome to Corona Telegram Bot by Felix");
  log.info("Init Storage...");
  await storage.init();
  log.info("Server is now running!");
  checkJob.start();
  //sendCoronaMessages();
}

// receive messages

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  log.info("[Msg]: " + msg.text + " (" + chatId + ")");
  switch (msg.text) {
    case "/register":
      registerUser(chatId);
      break;
    case "/start":
      registerUser(chatId);
      break;
    case "/sendMsg":
      sendCoronaMessages();
      break;
    default:
      // send help message
      break;
  }
});

// send message

async function sendCoronaMessages() {
  var oData = await getCoronaData();
  var oUsers = await storage.getItem("users");

  var msg =
    "Guten Morgen, in Deutschland wurden Gestern " +
    oData.delta.cases +
    " neue Corona-Infektionen gemeldet.";

  oUsers.users.forEach((user) => {
    try {
      log.info("Send Message: " + msg + " (" + user.chatId + ")");
      bot.sendMessage(user.chatId, msg);
      log.info("Success!");
    } catch (error) {
      log.error("Error: Sending Corona-Message failed!");
      log.error(error);
    }
  });
}

// register new users here who wants to get news

async function registerUser(chatId) {
  var oUsers = await storage.getItem("users");

  if (typeof oUsers === "undefined") {
    await storage.setItem("users", {
      users: [],
    });
    oUsers = await storage.getItem("users");
  }

  var bUserIsPresent = false;

  oUsers.users.forEach((element) => {
    if (element.chatId === chatId) {
      bot.sendMessage(chatId, "Du bist bereits registriert!");
      bUserIsPresent = true;
    }
  });

  if (!bUserIsPresent) {
    oUsers.users.push({
      chatId: chatId,
    });
    await storage.setItem("users", oUsers);
    bot.sendMessage(
      chatId,
      "Hi, sch??n dass du da bist! Ich habe dich hinzugef??gt. Ich informiere dich jetzt jeden morgen :)"
    );
  }
}

// here get the corona data for germany
function getCoronaData() {
  return new Promise((resolve, reject) => {
    Request.get("https://api.corona-zahlen.org/germany", (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        var oBody = JSON.parse(body);
        resolve(oBody);
      }
    });
  });
}

process.on("uncaughtException", function (err) {
  log.info("Caught exception: " + err);
});
