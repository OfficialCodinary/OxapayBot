require('dotenv').config();
const { Bot, session, Keyboard } = require('grammy');
const { conversations } = require('@grammyjs/conversations')
const mongoose = require('mongoose');
const db = require('./db');

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(session({
    initial: () => ({})
}));
bot.use(conversations());
bot.use(require('./commands/wallet'));
bot.use(require('./commands/deposit'));
bot.use(require('./commands/transfer'));

bot.command('start', async (ctx) => {
    await ctx.reply('Hello!\n Welcome to the Oxapay Demo Bot.', {
        reply_markup: new Keyboard()
            .text('💼 My profile').row()
            .text('💰 Deposit')
            .text('💸 Withdraw').row()
            .text('🔄 Transfer')
            .resized()
    });
});

bot.hears('💸 Withdraw', async (ctx) => {
    await ctx.reply('Under Development')
})

bot.callbackQuery('cancel', async (ctx) => {
    await ctx.answerCallbackQuery('Canceled');
    await ctx.editMessageText(`<s>${ctx.update.callback_query.message.text}</s>\n\n<i>Cancelled</i>`, {
        parse_mode: 'HTML'
    });
});

bot.catch((err) => {
    console.log(err);
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB')
        bot.start({
            drop_pending_updates: true,
            onStart: async (me) => {
                console.log(`Bot started as ${me.username}`);
            }
        });
    })
