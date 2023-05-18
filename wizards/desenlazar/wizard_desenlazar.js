const { Scenes } = require('telegraf');
const { valNumAndLength } = require('../globalFunctions');

const start_wizardDesenlazar_1 = ctx => {
    ctx.reply('Para poder desenlazar debe ingresar su PIN (este fue registrado al momento de enlazar su usuario).');
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
}

const desenlazar_wizard = async ctx => {
    ctx.wizard.state.data.saf_pin = ctx.message.text;
    if (valNumAndLength(ctx.wizard.state.data.saf_pin)) {
        let urlValidarPin = await fetch(
            `https://saf.aicsacorp.com/ords/safws/telegram/validar_pin?vid_chat=${ctx.from.id}&vpin=${ctx.wizard.state.data.saf_pin}`
        );
        let resPin = await urlValidarPin.json();

        if (resPin.valido > 0) {
            fetch(
                `https://saf.aicsacorp.com/ords/safws/telegram/desenlazar?vidchat=${ctx.from.id}`, {
                method: 'PUT'
            }
            ).then(response => {
                if (response.status == 201) ctx.reply("Usuario de Telegram Desenlazado, satisfactoriamente.");
            });
            return ctx.scene.leave();
        } else {
            ctx.reply("PIN Invalido. Ingrese su PIN nuevamente");
            return;
        }
    } else {
        ctx.reply("Debe ingresar un PIN de 6 digitos. Unicamente numeros. \nIngrese un PIN valido.");

        return;
    }
}

const desenlazarWizard = new Scenes.WizardScene(
    'desenlazar-wizard',
    start_wizardDesenlazar_1,
    desenlazar_wizard
);

module.exports = desenlazarWizard;