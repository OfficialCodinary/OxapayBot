const { Composer, InlineKeyboard } = require('grammy')
const db = require('../db');
const { createConversation } = require('@grammyjs/conversations')

const bot = new Composer()
bot.use(createConversation(transfer))

bot.hears('🔄 Transfer', async (ctx) => {
    await ctx.conversation.enter('transfer');
})

async function transfer(conversation, ctx) {
    await ctx.reply('Enter the amount(in $) you want to transfer');
    var amount = await conversation.form.number();
    await ctx.reply('Enter the userID of the person you want to transfer to');
    var userID = await conversation.form.number();
    await conversation.external(() => db.transferBalance(ctx.from.id, userID, amount))
    ctx.reply(`Successfully transferred ${amount}$ to ${userID}`);
    ctx.api.sendMessage(userID, `You have received ${amount}$ from ${ctx.from.id}`, {
        reply_markup: new InlineKeyboard()
            .text('Check Balance', 'profile')
            .url('Sent By', `tg://user?id=${ctx.from.id}`)
    });
    return
}

module.exports = bot