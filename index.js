const telegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const schedule = require('node-schedule');
const cheerio = require('cheerio');
const moment = require('moment');

const BOT_TOKEN = ''

const KEYWORDS = ['frontend', 'front-end', 'front end', 'react', 'javascript'];

const bot = new telegramBot(BOT_TOKEN, { polling: true });

let lastCheckedDay = moment().day();

const checkItText = "<a href='https://jobs.booking.com/careers?query=Front%20End&location=Amsterdam%2C%20Netherlands&pid=562949959717932&domain=booking.com&sort_by=relevance&triggerGoButton=false'>Check it yourself</a>"

console.log('Bot is starting...');

schedule.scheduleJob('0 8,10,12,14,16,18,20 * * *', () => {
    const currentDay = moment().day();

    if (currentDay !== lastCheckedDay) {
        lastCheckedDay = currentDay;
    }

    scrapeBookingDotCom();
});


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! I am a Career Safari Bot. I will try to help you to get a frontend engineer job at Booking.com. Type /checkfrontend to check Booking.com job openings.');
});

bot.onText(/\/checkfrontend/, async (msg) => {
    
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Checking Booking.com job openings...');

    scrapeBookingDotCom(chatId);
});

function parseJobPostings(html) {
    const jobPostings = [];

    const $ = cheerio.load(html);

    $('.position-card').each((index, element) => {
        const title = $(element).find('.position-title').text();

        if(!KEYWORDS.some(keyword => title.toLowerCase().includes(keyword))) {
            return;
        }
            
        jobPostings.push({ title });
    });

    return jobPostings;
}

async function scrapeBookingDotCom (chatId) {
    try {
        const response = await axios.get('https://jobs.booking.com/careers?query=Front%20End&location=Amsterdam%2C%20Netherlands&pid=562949959717932&domain=booking.com&sort_by=relevance&triggerGoButton=false');

        const jobPostings = parseJobPostings(response.data);

        if(jobPostings.length) {
            sendTimeMessage(chatId, `Yay! Found ${jobPostings.length} job ${jobPostings.length > 1 ? 'postings' : 'posting'}:`);

            jobPostings.forEach((index, jobPosting) => {
                bot.sendMessage(chatId, `${index + 1}. ${jobPosting.title}`);
                bot.sendMessage(chatId, `${checkItText}</p>`, { parse_mode: 'HTML' });
            });
        } else {
            bot.sendMessage(chatId, `Sorry, no job opennings. Do not trust me? ${checkItText}`, { parse_mode: 'HTML' });
        }
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'Sorry, I could not check the job postings. Please try again later.');
    }
}

