const TelegramBot = require("node-telegram-bot-api");
const config = require("./config");
const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");
const http = require("http");
const static = require("node-static");
const fileServer = new static.Server("public");

const TOKEN = config.token;

const bot = new TelegramBot(TOKEN, { polling: true });

//dialogs : [ {userId, date, state, messages} ] stores state of active dialogs with users
let dialogs = [];

const scenario = [
  { field: "name", question: "Ваше имя" },
  { field: "phone", question: "Телефон для связи" },
  { field: "description", question: "Опишите ситуацию текстом или голосом" },
  { field: "photo", question: "Добавьте фотографию" }
];

bot.onText(/\/start/, (msg, [source, match]) => {
  const { chat: { id, first_name, last_name }, text } = msg;
  const welcomeMessage = `Здравствуйте, ${first_name}! В этом боте вы можете сообщить о проблеме, с которой вы столкнулись в нашем городе.`;
  const opts = {
    reply_markup: {
      inline_keyboard
    }
  };
  bot.sendMessage(id, welcomeMessage, opts);
});

// старт заявки - ответ на нажатие инлайн кнопки
bot.on("callback_query", query => {
  // console.log("query", query);
  if (query.data == "Открыть заявку") {
    const userId = query.from.id;
    const id = query.id;
    const date = query.message.date;
    bot.sendMessage(userId, scenario[0].question);
    dialogs.push({ id, userId, date, state: 0, messages: [] });
  }
});

// when user sended message
bot.on("message", msg => {
  const userId = msg.from.id;
  const dialog = getDialog(userId);
  if (dialog) {
    dialog.messages.push(msg);
    dialog.state++;
    dialogs = updateDialog(dialog);

    if (dialog.state < scenario.length) {
      bot.sendMessage(userId, scenario[dialog.state].question);
    }
    if (dialog.state == scenario.length) {
      //мы достигли конца сценария, получили все данные, сохраняем их в базу данных и удаляем активный диалог
      dialogToSituation(dialog);
    }
  }
});

bot.on("polling_error", error => {
  console.log(error); // => 'EFATAL'
});

//Dialogs
function getDialog(userId) {
  return dialogs.filter(elem => {
    return elem.userId == userId;
  })[0];
}

function updateDialog(dialog) {
  return dialogs.map(elem => {
    if (elem.userId == dialog.userId) return dialog;
    else return elem;
  });
}

function deleteDialog(userId) {
  return dialogs.filter(elem => {
    return elem.userId != userId;
  });
}
/* 
  { field: "name", question: "Ваше имя" },
  { field: "phone", question: "Телефон для связи" },
  { field: "description", question: "Опишите ситуацию текстом или голосом" },
  { field: "photo", question: "Добавьте фотографию" }
*/
function dialogToSituation(dialog) {
  const { id, userId, date, messages } = dialog;
  const situation = { id, userId, date };
  const downloads = []; // for Promis.All
  messages.forEach((msg, index) => {
    //console.log(msg.text, index);
    const field = scenario[index].field;
    if (msg.text) situation[field] = msg.text;
    else if (msg.photo) {
      //id of photo
      situation[field] = {};
      situation[field].id = msg.photo[msg.photo.length - 1].file_id;
      const file_photo = bot.downloadFile(
        situation[field].id,
        "public/files/photo"
      );
      downloads.push(file_photo);
      file_photo.then(result => {
        //path to photo after download
        situation[field].path = result.replace("public/", "");
        console.log("situation", situation);
      });
    } else if (msg.voice) {
      situation[field] = {};
      situation[field].id = msg.voice.file_id;
      const file_voice = bot.downloadFile(
        situation[field].id,
        "public/files/voice"
      );
      downloads.push(file_voice);
      file_voice.then(result => {
        //result is the path to voice after download, without ".ogg"
        fs.rename(result, result + ".ogg", function(err) {
          if (err) console.log("Ошибка при переименовании файла: " + err);
        });
        situation[field].path = result.replace("public/", "") + ".ogg";
      });
    }
  });
  Promise.all(downloads).then(results => {
    //console.log("promise all results:", results);
    const dbSaveInfo = saveToDB(situation, "situations");
  });
}

//save message to DataBase
function saveToDB(doc, collection) {
  let dbSaveInfo = "";
  MongoClient.connect(config.mongoUrl, function(err, db) {
    if (err) throw err;
    var dbo = db.db("cityChallengeBot");
    dbo.collection(collection).insertOne(doc, function(err, res) {
      if (err) {
        dbSaveInfo = "Что-то пошло не так...";
        bot.sendMessage(doc.userId, dbSaveInfo);
        throw err;
      }
      //console.log("1 document inserted");
      dbSaveInfo = "Ваша заявка успешно сохранена.";
      db.close();
      dialogs = deleteDialog(doc.userId);
      bot.sendMessage(doc.userId, dbSaveInfo);
    });
  });
  return dbSaveInfo;
}

const inline_keyboard = [
  [
    {
      text: "Открыть заявку",
      callback_data: "Открыть заявку"
    }
  ]
];

http
  .createServer(function(request, response) {
    request
      .addListener("end", function() {
        fileServer.serve(request, response);
      })
      .resume();
  })
  .listen(8080);

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
