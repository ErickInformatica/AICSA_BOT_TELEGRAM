const { Telegraf, Scenes, session } = require('telegraf');
const express = require('express');
require('dotenv').config()
const EnlazarWizard = require('./wizards/enlazar/wizard_enlazar');
const DesenlazarWizard = require('./wizards/desenlazar/wizard_desenlazar');

const bot = new Telegraf(process.env.TG_HASH);
let apex_dat = {};

const stage = new Scenes.Stage([EnlazarWizard, DesenlazarWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.start(ctx => {
  bot.telegram.sendMessage(ctx.chat.id, 'Bienvenido al Bot de SAF AICSA, en el boton inferior izquierdo de color celeste con texto "Menu" podra visualizar los comandos a utilizar.')
})

bot.command('enlazar', async (ctx) => {    
  let urlValidarEnlaceCreado = await fetch(
    `https://saf.aicsacorp.com/ords/safws/telegram/id_chat_exists/${ctx.from.id}`
  );
  let resValEnlace = await urlValidarEnlaceCreado.json();
  apex_dat.existe = resValEnlace.existe;
  if(resValEnlace.existe > 0){
    ctx.reply('El Usuario de Telegram, ya se encuentra enlazado a SAF. \nDesea desenlazar ese usuario?', {
      reply_markup: {
        inline_keyboard: [
          [ { text: "Si", callback_data: "SI_SAF" }, { text: "No", callback_data: "NO_SAF" } ]
        ]
      }
    })

    bot.action('NO_SAF', (ctx) => {
      ctx.editMessageReplyMarkup();
      ctx.reply('Gracias por utilizar el Bot de SAF.');
    })
    bot.action('SI_SAF', (ctx) => {
      ctx.editMessageReplyMarkup();
      ctx.scene.enter('desenlazar-wizard');
    })
  } else {
    apex_dat = {};
    ctx.scene.enter('enlazar-wizard');
  }
  
})

bot.launch();

// EXPRESS CONFIGURATION
const app = express();

// Set up a route to handle Telegram updates
app.use(express.json());


//ENVIAR TOKEN DE INGRESO
app.post('/sendMsg',async (req, res) => {
  let token = req.query.token;
  let cod_usuario = req.query.cod_usuario;

  let urlObtenerIdChat = await fetch(
    `https://saf.aicsacorp.com/ords/safws/telegram/id_char_usuario/${cod_usuario}`
  );
  const resIdChat = await urlObtenerIdChat.json();
  const textoMensaje = `Introduzca el siguiente código en los próximos 3 minutos para terminar de confirmar su inicio de sesión. \n<b>${token}</b>`;

if(resIdChat.items.length == 0) return res.status(400).send({error: 'No existe un Usuario con el Codigo de Usuario solicitado.'})  
  bot.telegram.sendMessage(resIdChat.items[0].id_chat_telegram, textoMensaje, {parse_mode: 'HTML'});
  return res.status(200).send({ msg : 'Mensaje enviado con Exito.'})
});



app.listen(3000, () => {
  console.log('Bot is running on port 3000');
});