const { Composer, InlineKeyboard } = require('grammy')
const { createConversation } = require('@grammyjs/conversations')
const { Merchant } = require('oxapay');
const db = require('../db');
const merchantClient = new Merchant(process.env.MerchantKey);

const bot = new Composer()
bot.use(createConversation(deposit))

bot.hears('💰 Deposit', async (ctx) => {
    await ctx.conversation.enter('deposit');
})

async function deposit(conversation, ctx) {
    await ctx.reply('Enter the amount(in $) you want to deposit');
    var amount = await conversation.form.number();
    await conversation.external(() => confirmDeposit(amount, ctx))
    return
}

async function confirmDeposit(amount, ctx) {
    await ctx.reply(`*You want to deposit ${amount}$*`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('Yes', 'confirmDeposit ' + amount)
            .text('No', 'cancel')
    });
}

bot.callbackQuery(/^confirmDeposit (.+)/, async (ctx) => {
    const amount = parseInt(ctx.match[1]);
    await ctx.answerCallbackQuery('Generating Payment Portal...');
    await ctx.editMessageText('Loading...')
    const payment = await merchantClient.createInvoice({
        amount: amount,
        lifeTime: 120,
        feePaidByPayer: 1,
        description: `Payment for Codinary`
    });
    await db.addOrder(ctx.from.id, payment.trackId, amount);
    await ctx.editMessageText(`*Payment for order #${payment.trackId}*\n\n*TrackID:* \`${payment.trackId}\`\n*Amount:* ${amount}$\n*Time Limit:* 2 hours\n*Status:* Pending\n\n_If the below link doesn't work try_ [here](${payment.payLink})`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .url('Pay', payment.payLink)
            .text('Check Status', 'checkStatus ' + payment.trackId)
    }).then(async (res) => {
        await ctx.api.pinChatMessage(ctx.chat.id, res.message_id)
        setTimeout(async () => {
            await ctx.api.unpinChatMessage(ctx.chat.id, res.message_id)
        }, 60*60*2*1000)
    })
        .catch(async () => {
            await ctx.deleteMessage();
            await ctx.answerCallbackQuery('Please make a new deposit request. Your previous request has expired.');
        })
});

bot.callbackQuery(/^checkStatus (.+)/, async (ctx) => {
    const orderID = parseInt(ctx.match[1]);
    await ctx.answerCallbackQuery('Checking order...');

    const order = await merchantClient.paymentInfo({ trackId: orderID })
    if (order.result === 116) {
        await ctx.editMessageText(`Oops! Seems like the order has expired. Please make a new deposit request.`);
        return
    }
    if (order.status === 'Paid') {
        if ((await db.checkOrder(ctx.from.id, orderID)) === false) {
            await ctx.answerCallbackQuery(`Order #${orderID} is already processed`);
        } else {
            await db.addBalance(ctx.from.id, order.amount, orderID);
            await ctx.reply(`+${order.amount}$ added to your wallet`);
        }
    }
    var extra = {
        reply_markup: { ...ctx.update.callback_query.message.reply_markup }
    }

    if (order) {
        await ctx.editMessageText(`*Payment for order #${order.trackId}*\n\n*TrackID:* \`${order.trackId}\`\n*Amount:* ${order.amount || (await db.getOrder(ctx.from.id, orderID)).amount}$\n*Status:* ${order.status}`, {
            parse_mode: 'Markdown',
            ...(order.status === 'Paid' ? {} : extra)
        });
    } else {
        await ctx.reply('No order found with that ID');
    }
})

module.exports = bot;
