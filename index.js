import TelegramBot from "node-telegram-bot-api";
import config from "./config";

//console.log("config", config);

const TOKEN = config.token;
const bot = new TelegramBot(TOKEN, { polling: true });

/* 
// bot sends back your message...
bot.on("message", msg => {
  const { chat: { id }, text } = msg;
  console.log(msg);
  bot.sendMessage(id, text);
}); */

bot.on("polling_error", error => {
  console.log(error); // => 'EFATAL'
});

bot.onText(/\/start/, (msg, [source, match]) => {
  const { chat: { id, first_name, last_name }, text } = msg;
  const welcomeMessage = `Здравствуйте, ${first_name} ${last_name}! В этом боте вы можете сообщить о проблеме, с которой вы столкнулись в нашем городе.`;
  bot.sendMessage(id, welcomeMessage);
});

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
