const { Scenes } = require('telegraf');
const { valNumAndLength } = require('../globalFunctions');
const { response } = require('express');

let apex_dat = {};

const start_superWizard_1 = async ctx => {
    ctx.wizard.state.data = {};
    ctx.wizard.state.data.count_user = 1;
    ctx.wizard.state.data.count_pass = 1;
    ctx.wizard.state.data.id_chat_tele = ctx.from.id;
    ctx.wizard.state.data.username_user = ctx.from.username;
    var urlValidarIdChat_sin_estado = await fetch(
        `https://saf.aicsacorp.com/ords/safws/telegram/id_chat_sin_estado/${ctx.from.id}`
    );
    var resIdChatSinEstado = await urlValidarIdChat_sin_estado.json();
    ctx.wizard.state.data.existe_sin_estado = resIdChatSinEstado.existe;
    ctx.reply("Ingresa tu usuario de SAF.");

    return ctx.wizard.next();
}

const valUser_superWizard_2 = async ctx => {
    ctx.wizard.state.data.saf_user = ctx.message.text.split(' ')[0].toUpperCase();
    var urlValidarUsuario = await fetch(
        `https://saf.aicsacorp.com/ords/safws/telegram/usuario/${ctx.wizard.state.data.saf_user}`
    );
    var resUsuario = await urlValidarUsuario.json();

    if (resUsuario.items[0].existe > 0) {
        ctx.reply("Ingrese su contraseña para validar Usuario.");
        return ctx.wizard.next();
    } else {
        if (ctx.wizard.state.data.count_user <= 3) {
            ctx.reply(`Usuario inexistente, ingrese un Usuario valido. Intento No.${ctx.wizard.state.data.count_user}`);
            ctx.wizard.state.data.count_user++;
            return;
        } else {
            ctx.reply("Supero la cantidad de intentos.");
            return ctx.scene.leave();
        }

    }
}

const valPass_superWizard_3 = async ctx => {
    ctx.wizard.state.data.saf_pass = ctx.message.text;
    await fetch(
        `https://saf.aicsacorp.com/ords/safws/telegram/usuario_login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "vuser_apex": ctx.wizard.state.data.saf_user,
            "vpass_apex": ctx.wizard.state.data.saf_pass
        })
    }


    ).then(response => {
        if (response.status == 200) {
            if (ctx.wizard.state.data.existe_sin_estado == 0) {
                ctx.reply("Usuario Validado, para terminar de configurar la validacion de 2 pasos para SAF. Debe ingresar un PIN de 6 digitos.");
                return ctx.wizard.next();
            } else {
                fetch('https://saf.aicsacorp.com/ords/safws/telegram/enlazar', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "user_telegram": ctx.wizard.state.data.username_user,
                        "id_telegram": ctx.wizard.state.data.id_chat_tele,
                        "nuser": ctx.wizard.state.data.saf_user
                    })
                }).then(response => {
                    if (response.status == 201) ctx.reply("Usuario enlazado nuevamente satisfactoriamente.");
                });
                return ctx.scene.leave();
            }

        } else {
            if (ctx.wizard.state.data.count_pass <= 3) {
                ctx.reply(`Contraseña incorrecta, ingresa la contraseña correcta. \nIntento No.${ctx.wizard.state.data.count_pass}`);
                ctx.wizard.state.data.count_pass++
                return;
            } else {
                ctx.reply("Supero la cantidad de intentos.");
                return ctx.scene.leave();
            }

        }
    });
}

const valPIN_enlazar_superWizar_4 = async ctx => {
    console.log(ctx.wizard.state.data.existe_sin_estado);
    
    ctx.wizard.state.data.saf_pin = ctx.message.text;
    console.log(ctx.wizard.state.data.saf_pin)
    if (ctx.wizard.state.data.existe_sin_estado == 0) {
        let valPin = await valNumAndLength(ctx.wizard.state.data.saf_pin);
        
        if (valPin) {
            console.log(valPin);
            try {
                let respPost = await fetch('https://saf.aicsacorp.com/ords/safws/telegram/enlazar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "user_telegram": ctx.wizard.state.data.username_user == undefined ? null : ctx.wizard.state.data.username_user,
                        "id_telegram": ctx.wizard.state.data.id_chat_tele,
                        "nuser": ctx.wizard.state.data.saf_user,
                        "pin_validacion": ctx.wizard.state.data.saf_pin
                    })
                });

                const datos = respPost;
                if(respPost.status == 201){
                    ctx.reply("Usuario enlazado satisfactoriamente.");
                    return ctx.scene.leave();
                }
                
            } catch (error) {
                console.log(error);
            }                    
        } else {
            ctx.reply("Debe ingresar un PIN de 6 digitos. Unicamente numeros. \nIngrese un PIN valido.");
            return;
        }
    }

}

const enlazarWizard = new Scenes.WizardScene(
    'enlazar-wizard',
    start_superWizard_1,
    valUser_superWizard_2,
    valPass_superWizard_3,
    valPIN_enlazar_superWizar_4
);

module.exports = enlazarWizard;