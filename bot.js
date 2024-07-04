const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

// Initialize the Discord client with the necessary intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent 
  ] 
});

// Load OpenAI API configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

let memory = {
  users: {},
  conversations: []
};

// Function to save memory to a file
function saveMemory() {
  fs.writeFileSync('memory.json', JSON.stringify(memory, null, 2));
}

// Function to load memory from a file
function loadMemory() {
  try {
    memory = JSON.parse(fs.readFileSync('memory.json', 'utf8'));
  } catch (error) {
    saveMemory();
  }
}

// Event handler when the bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  loadMemory();
});

// Event handler for new messages
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const userId = message.author.id;
  if (!memory.users[userId]) {
    memory.users[userId] = { name: message.author.username, messages: [] };
  }

  memory.users[userId].messages.push(message.content);
  memory.conversations.push({ user: message.author.username, message: message.content });

  saveMemory();

  const prompt = `User: ${message.content}\nBot:`;
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 150,
  });

  const botReply = response.data.choices[0].text.trim();
  message.channel.send(botReply);
});

// Login to Discord with the bot token
client.login(process.env.DISCORD_BOT_TOKEN);
