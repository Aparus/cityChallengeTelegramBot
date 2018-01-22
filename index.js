var TelegramBot = require("node-telegram-bot-api");
var config = require("./config");
var MongoClient = require("mongodb").MongoClient;
var http = require("http");

const TOKEN = config.token;

const bot = new TelegramBot(TOKEN, { polling: true });

//dialogs : [ {userId, date, state, messages} ] stores active dialogs and their states
let dialogs = [];

const scenario = [
  { field: "name", question: "Ваше имя" },
  { field: "phone", question: "Телефон для связи" },
  { field: "description", question: "Опишите ситуацию текстом или голосом" },
  { field: "photo", question: "Добавьте фотографию" }
];

// when user sended message
bot.on("message", msg => {
  const userId = msg.from.id;
  const dialog = dialogs.filter(elem => {
    return elem.userId == userId;
  })[0];
  console.log("dialog", dialog);
  if (dialog) {
    dialog.messages.push(msg);
    bot.sendMessage(userId, scenario[dialog.state++].question);
    //
    dialogs = dialogs.map(elem => {
      if (elem.userId == userId) return dialog;
      else return elem;
    });
    console.log("dialogs", dialogs);
  }
});

bot.onText(/\/start/, (msg, [source, match]) => {
  const { chat: { id, first_name, last_name }, text } = msg;
  const welcomeMessage = `Здравствуйте, ${first_name} ${last_name}! В этом боте вы можете сообщить о проблеме, с которой вы столкнулись в нашем городе.`;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Открыть заявку",
            callback_data: "Открыть заявку"
          }
        ]
      ]
    }
  };
  bot.sendMessage(id, welcomeMessage, opts);
});

// формирование заявки - ответ на нажатие инлайн кнопки
bot.on("callback_query", query => {
  // console.log("query", query);
  if (query.data == "Открыть заявку") {
    const order = {}; // заявка
    const userId = query.from.id;
    const date = query.message.date;
    bot.sendMessage(userId, scenario[0].question);
    dialogs.push({ userId, date, state: 0, messages: [] });
  }
});

bot.on("polling_error", error => {
  // console.log(error); // => 'EFATAL'
});

/* 
//run http server 
http
.createServer(function(req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("Hello World!");
    res.end();
})
.listen(8080);
*/

/* 
// file download example (file_id, path)
bot.downloadFile(
  "AgADAgADfKgxG1s3AUtXkCcAAX5i_T93EpwOAATRd7iqqn_lvf5UAAIC",
  "photo"
); */

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

/* 
//example with force_replay
    var opts = {
      reply_markup: JSON.stringify({ force_reply: true })
    };
    // question 1
    bot
      .sendMessage(fromId, "Enter your phone number1", opts)
      .then(function(sended) {
        var chatId = sended.chat.id;
        var messageId = sended.message_id;
        bot.onReplyToMessage(chatId, messageId, message => {
          order.phone1 = message.text;

          // question 2
          bot
            .sendMessage(fromId, "Enter your phone number2", opts)
            .then(function(sended) {
              var chatId = sended.chat.id;
              var messageId = sended.message_id;
              bot.onReplyToMessage(chatId, messageId, message =>  {
                order.phone2 = message.text;

                // question 3
                bot
                  .sendMessage(fromId, "Enter your phone number3", opts)
                  .then(function(sended) {
                    var chatId = sended.chat.id;
                    var messageId = sended.message_id;
                    bot.onReplyToMessage(chatId, messageId, message =>  {
                      order.phone3 = message.text;
                      console.log("order", order);
                    });
                  });
              });
            });
        });
      });
*/

/* 
  //save message to DataBase
  MongoClient.connect(config.mongoUrl, function(err, db) {
    if (err) throw err;
    var dbo = db.db("cityChallengeBot");
    dbo.collection("messages").insertOne(msg, function(err, res) {
      if (err) throw err;
      //console.log("1 document inserted");
      db.close();
    });
  });
  //download files to server, by file_id and path
  //photo is array of 4 images with different size, now we need only one, with better quality
  if (msg.photo) {
    const file_photo = bot.downloadFile(
      msg.photo[msg.photo.length - 1].file_id,
      "files/photo"
    );
    file_photo.then(result => {
      //console.log("file_photo.then", result); // files/photo/file_18.jpg
    });
  }
  if (msg.voice) {
    const file_voice = bot.downloadFile(msg.voice.file_id, "files/voice");
  }
*/
