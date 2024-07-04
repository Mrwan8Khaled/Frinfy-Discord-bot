import discord
import os
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Discord client
intents = discord.Intents.default()
intents.typing = False
intents.presences = False
client = discord.Client(intents=intents)

# Initialize OpenAI API
openai.api_key = os.getenv('OPENAI_API_KEY')

# Memory to store user conversations
memory = {
    'users': {},
    'conversations': []
}

# Function to save memory to a file
def save_memory():
    with open('memory.json', 'w') as f:
        json.dump(memory, f, indent=2)

# Function to load memory from a file
def load_memory():
    global memory
    try:
        with open('memory.json', 'r') as f:
            memory = json.load(f)
    except FileNotFoundError:
        save_memory()

# Event handler when the bot is ready
@client.event
async def on_ready():
    print(f'Logged in as {client.user.name}')

    # Load memory on bot startup
    load_memory()

# Event handler for new messages
@client.event
async def on_message(message):
    if message.author.bot:
        return
    
    user_id = str(message.author.id)
    if user_id not in memory['users']:
        memory['users'][user_id] = {
            'name': message.author.name,
            'messages': []
        }

    memory['users'][user_id]['messages'].append(message.content)
    memory['conversations'].append({
        'user': message.author.name,
        'message': message.content
    })
    save_memory()

    prompt = f"User: {message.content}\nBot:"
    response = openai.Completion.create(
        engine="davinci",
        prompt=prompt,
        max_tokens=150
    )
    bot_reply = response.choices[0].text.strip()

    await message.channel.send(bot_reply)

# Run the bot
client.run(os.getenv('DISCORD_BOT_TOKEN'))