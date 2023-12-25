# OxapayBot

OxapayBot is an open-source Telegram bot developed using GrammY, mongoose, dotenv, and oxapay libraries in Node.js. The bot serves as a wallet system within Telegram, facilitating functionalities like deposit, transfer, withdraw, balance checking, and more. Its primary goal is to demonstrate the development of Oxapay-based bots.

## Features

- Deposit funds
- Transfer funds between users
- Withdraw funds
- Check account balance

## Getting Started

To get OxapayBot running on your local machine, follow these steps:

### Prerequisites

- Node.js (version 18.0.0 or higher)
- npm (Node Package Manager)
- MongoDB

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/OfficialCodinary/OxapayBot.git
    cd OxapayBot
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    Create a `.env` file in the root directory of the project and add the following content:

    ```env
    BOT_TOKEN="YourTelegramBotTokenHere"
    MerchantKey="sandbox"
    MONGO_URI="mongodb://localhost:27017/"
    ```

    Replace `YourTelegramBotTokenHere` with your actual Telegram bot token, and adjust other values if needed.

### Usage

Start the bot by running:

```bash
npm start 
```
or run in nodemon
```bash
npm dev
```
or run in production
```bash
npm pm2
```
Your OxapayBot should now be active on Telegram, ready to execute various wallet-related commands.

## Contributions and Enhancement

OxapayBot is actively seeking enhancements in both UI and backend development:

### UI Enhancements

- Incorporate emojis for improved visual representation
- Enhance text messages for better user interaction

### Backend Enhancements

- Optimize existing code for performance
- Implement better methods and approaches for functionalities

Contributions are welcomed! If you're interested in enhancing the bot, please follow the [CODE OF CONDUCT](CODE_OF_CONDUCT).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [GrammY](https://grammy.dev/) - The Telegram bot framework used in this project
- [mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [dotenv](https://npmjs.com/package/dotenv) - Environment variable management
- [oxapay](https://npmjs.com/package/oxapay) - Oxapay library
