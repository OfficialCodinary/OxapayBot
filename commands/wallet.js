const { Composer, InlineKeyboard } = require('grammy')
const db = require('../db');
const bot = new Composer()


async function walletHandler(ctx) {
    const balance = await db.getBalance(ctx.from.id);
    await ctx[ctx.update.callback_query ? 'editMessageText' : 'reply'](`Profile\n\nUser ID: \`${ctx.from.id}\`\nBalance: ${balance}$`, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
            .text('Transaction history', 'transactions')
    });
}

bot.hears('💼 My profile', walletHandler);
bot.callbackQuery('profile', walletHandler);

bot.callbackQuery(/^\btransactions\b/, transactionHandler);

async function transactionHandler(ctx) {
    var array = await db.getTransactions(ctx.from.id);

    if (array.length === 0) {
        await ctx.answerCallbackQuery('No transactions found');
        return;
    }

    var txt = '*Transaction history:*\n\n'
    var dataPerPage = 5
    var callbackData = ctx.update.callback_query?.data.split(' ')
    var currentCall = callbackData[0]
    var params = parseInt(callbackData[1]) || 0

    var keyBoard = new InlineKeyboard()
    //Add next & Back accordingly
    if (params !== 0) keyBoard.text("Back", `${currentCall} ${params - 1} `);
    if ((params + 1) * dataPerPage < array.length) keyBoard.text("Next", `${currentCall} ${params + 1} `);
    keyBoard.row()

    //Add page counting
    if (Math.floor(array.length / (dataPerPage + 1)) !== 0) keyBoard.text('Page: ' + (params + 1) + '/' + Math.ceil(array.length / dataPerPage), 'null').row()
    keyBoard.text('Back to wallet', 'profile')

    array.slice(params * dataPerPage, (params + 1) * dataPerPage).forEach((transaction) => {
        const formattedDate = transaction.date.toLocaleString('en-US', {
            year: '2-digit',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
        txt += `*${transaction.amount}$*\n _Type: ${transaction.type}_\n _Date: ${formattedDate}_\n\n`;
    });

    ctx.editMessageText(txt, {
        parse_mode: 'Markdown',
        reply_markup: keyBoard
    })
}

module.exports = bot;