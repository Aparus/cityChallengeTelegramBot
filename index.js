import TelegramBot from "node-telegram-bot-api";
import config from "./config";
var MongoClient = require("mongodb").MongoClient;
var http = require("http");

const TOKEN = config.token;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", msg => {
  MongoClient.connect(config.mongoUrl, function(err, db) {
    if (err) throw err;
    var dbo = db.db("cityChallengeBot");
    dbo.collection("messages").insertOne(msg, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
  if (msg.photo)
    msg.photo.forEach(element => {
      bot.downloadFile(element.file_id, "files/photo");
    });
  if (msg.voice) bot.downloadFile(msg.voice.file_id, "files/voice");
});

/* 
// file download example
bot.downloadFile(
  "AgADAgADfKgxG1s3AUtXkCcAAX5i_T93EpwOAATRd7iqqn_lvf5UAAIC",
  "photo"
); */

bot.onText(/\/start/, (msg, [source, match]) => {
  const { chat: { id, first_name, last_name }, text } = msg;
  const welcomeMessage = `Здравствуйте, ${first_name}! Мне Вы можете сообщить о проблеме, с которой столкнулись в нашем городе.`;
  bot.sendMessage(id, welcomeMessage);
});

bot.on("polling_error", error => {
  console.log(error); // => 'EFATAL'
});

http
  .createServer(function(req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("Hello World!");
    res.end();
  })
  .listen(8080);
/* 
// message object example, that recievs server on event: bot.on("message", msg =>  

{ message_id: 7,
  from:
   { id: 131455605,
     is_bot: false,
     first_name: 'Rustam',
     last_name: 'Apaev',
     username: 'aparus',
     language_code: 'en-US' },
  chat:
   { id: 131455605,
     first_name: 'Rustam',
     last_name: 'Apaev',
     username: 'aparus',
     type: 'private' },
  date: 1516191119,
  text: 'hahaha' }
*/

/* 
// bot sends back your message...
bot.on("message", msg => {
  const { chat: { id }, text } = msg;
  console.log(msg);
  bot.sendMessage(id, text);
}); */
