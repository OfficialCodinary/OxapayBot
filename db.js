const mongoose = require('mongoose');

const transactions = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
    },
    orderId: {
        type: String,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 2 // 2 days
    }
});

const balanceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    orders: {
        type: [orderSchema],
        default: []
    },
    transactions: {
        type: [transactions],
        default: []
    }
});

const Balance = mongoose.model('Balance', balanceSchema);


/**
 * Adds an order for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} orderId - The ID of the order.
 * @param {number} amount - The amount of the order.
 * @returns {Array} - The updated list of orders for the user.
 * @throws {Error} - If failed to add the order.
 */
async function addOrder(userId, orderId, amount) {
    try {
        await createUser(userId);
        let balance = await Balance.findOne({ userId });
        balance.orders.push({ orderId, amount });
        await balance.save();
        return balance.orders;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to add order');
    }
}

/**
 * Checks if an order is valid for a given user.
 * @param {string} userId - The ID of the user.
 * @param {string} orderId - The ID of the order.
 * @returns {boolean} - Returns true if the order is valid and unpaid, false otherwise.
 * @throws {Error} - Throws an error if there is a failure in checking the order.
 */
async function checkOrder(userId, orderId) {
    try {
        await createUser(userId);
        let balance = await Balance.findOne({ userId });
        let order = balance.orders.find(order => parseInt(order.orderId) === parseInt(orderId));
        if (!order || order.isPaid === true) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed to check order');
    }
}

/**
 * Retrieves the order for a given user and order ID.
 * @param {string} userId - The ID of the user.
 * @param {string} orderId - The ID of the order.
 * @returns {Promise<Object>} - The order object.
 * @throws {Error} - If there is an error retrieving the order.
 */
async function getOrder(userId, orderId) {
    try {
        await createUser(userId);
        let balance = await Balance.findOne({ userId });
        let order = balance.orders.find(order => parseInt(order.orderId) === parseInt(orderId));
        return order;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to get order');
    }
}


/**
 * Creates a user with the specified userId.
 * If the user already exists, returns the existing user.
 * @param {string} userId - The unique identifier for the user.
 * @returns {Promise<Object>} - The created or existing user object.
 * @throws {Error} - If there is an error creating the user.
 */
async function createUser(userId) {
    try {
        let user = await Balance.findOne({ userId });
        if (!user) {
            user = new Balance({ userId });
            await user.save();
        }
        return user;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to create user');
    }
}

/**
 * Adds balance to a user's account and updates the transaction history.
 * @param {string} userId - The ID of the user.
 * @param {number} amount - The amount to be added to the balance.
 * @param {string|null} orderId - The optional ID of the order.
 * @returns {Promise<number>} The updated balance.
 * @throws {Error} If failed to add balance.
 */
async function addBalance(userId, amount, orderId = null) {
    try {
        await createUser(userId);
        let balance = await Balance.findOne({ userId });
        if (!balance) balance = new Balance({ userId });
        balance.balance = parseInt(balance.balance) + parseInt(amount);
        balance.transactions.push({ type: 'add', amount, orderId }); // Add transaction to the array with optional orderId

        // Set isPaid to true for the corresponding order
        if (orderId) {
            const order = balance.orders.findIndex(order => order.orderId.toString() === orderId.toString());
            if (order !== -1) {
                balance.orders[order].isPaid = true;
            }
        }

        await balance.save();
        return balance.balance;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to add balance');
    }
}

/**
 * Removes the specified amount from the user's balance.
 * @param {string} userId - The ID of the user.
 * @param {number} amount - The amount to be removed from the balance.
 * @returns {Promise<number>} The updated balance after removing the amount.
 * @throws {Error} If the user is not found or if the balance is insufficient.
 * @throws {Error} If there is an error while removing the balance.
 */
async function removeBalance(userId, amount) {
    try {
        await createUser(userId);
        let balance = await Balance.findOne({ userId });
        if (!balance) throw new Error('User not found');
        if (balance.balance < amount) throw new Error('Insufficient balance');
        balance.balance -= amount;
        balance.transactions.push({ type: 'remove', amount }); // Add transaction to the array
        await balance.save();
        return balance.balance;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to remove balance');
    }
}

/**
 * Retrieves the balance of a user.
 * @param {string} userId - The ID of the user.
 * @returns {number} The balance of the user.
 * @throws {Error} If the user is not found or if there is an error retrieving the balance.
 */
async function getBalance(userId) {
    try {
        await createUser(userId);
        let balance = await Balance.findOne({ userId });
        if (!balance) throw new Error('User not found');
        return balance.balance;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to get balance');
    }
}

/**
 * Transfers balance from one user to another.
 * @param {string} fromUserId - The ID of the user transferring the balance.
 * @param {string} toUserId - The ID of the user receiving the balance.
 * @param {number} amount - The amount of balance to transfer.
 * @returns {Promise<{ fromBalance: number, toBalance: number }>} - The updated balances of the users.
 * @throws {Error} - If the user is not found or if there is insufficient balance.
 */
async function transferBalance(fromUserId, toUserId, amount) {
    try {
        await createUser(fromUserId);
        await createUser(toUserId);
        let fromBalance = await Balance.findOne({ userId: fromUserId });
        let toBalance = await Balance.findOne({ userId: toUserId });
        if (!fromBalance || !toBalance) throw new Error('User not found');
        if (fromBalance.balance < amount) throw new Error('Insufficient balance');
        fromBalance.balance -= amount;
        toBalance.balance += amount;
        fromBalance.transactions.push({ type: 'transfer out', amount }); // Add transaction to the array
        toBalance.transactions.push({ type: 'transfer in', amount }); // Add transaction to the array
        await fromBalance.save();
        await toBalance.save();
        return { fromBalance: fromBalance.balance, toBalance: toBalance.balance };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to transfer balance');
    }
}

/**
 * Retrieves the transactions for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Array} - An array of transactions.
 * @throws {Error} - If there is an error retrieving the transactions.
 */
async function getTransactions(userId) {
    try {
        await createUser(userId);
        let balance = await Balance.findOne({ userId });
        if (!balance) throw new Error('User not found');
        return balance.transactions;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to get transactions');
    }
}

module.exports = {
    addBalance,
    removeBalance,
    getBalance,
    transferBalance,
    addOrder,
    checkOrder,
    getOrder,
    getTransactions
};