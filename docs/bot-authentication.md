# Bot Token Authentication Guide

This document explains how to use the new Bot Token authentication feature in Telegram Search, which provides an alternative to user phone number authentication.

## Overview

Bot Token authentication allows you to:
- Use Telegram Bot API instead of user credentials
- Avoid sharing personal phone numbers
- Manually import chat history data
- Work in environments where user authentication is not desired

## Quick Start

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token (format: `123456789:AAAA_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`)

### 2. Configure Bot Token

Add your bot token to the configuration file:

```yaml
# config/config.yaml
api:
  telegram:
    apiId: 'your_api_id'
    apiHash: 'your_api_hash'
    botToken: 'your_bot_token_here'  # Add this line
```

### 3. Login with Bot Token

1. Start the application
2. Navigate to the login page
3. Select "Bot 登录" (Bot Login)
4. Enter your bot token
5. Click "登录" (Login)

### 4. Import Chat Data

Since bots have limited access to historical data, you'll need to manually import chat records:

1. After logging in, click "导入数据" (Import Data) or navigate to `/import`
2. Export your chat history from Telegram Desktop:
   - Open Telegram Desktop
   - Select the chat you want to export
   - Click the three-dot menu → "导出聊天记录" (Export Chat History)
   - Choose JSON format
   - Wait for export to complete
3. Upload the exported JSON file to the import page
4. Wait for processing to complete

## Bot Limitations

Bot authentication has several limitations compared to user authentication:

### What Bots Can Do:
- ✅ Read messages in groups where the bot is added
- ✅ Read messages in channels where the bot is added
- ✅ Access basic user information in those chats
- ✅ Work without exposing personal credentials

### What Bots Cannot Do:
- ❌ Read private messages (DMs) unless they're part of the conversation
- ❌ Access historical messages sent before the bot was added
- ❌ Automatically discover and join chats
- ❌ Read messages in groups/channels where they're not members

## Manual Import Process

### Supported Formats

Currently supported import formats:
- **Telegram Desktop JSON Export**: Full message history with metadata
- **File Size Limit**: 500MB per file
- **Content Types**: Text messages, media information, user data

### Export from Telegram Desktop

1. **Install Telegram Desktop** if not already installed
2. **Select Chat**: Open the chat/group/channel you want to export
3. **Access Export Menu**:
   - Click the three-dot menu (⋮) in the top-right
   - Select "Export chat history"
4. **Choose Settings**:
   - Format: JSON
   - Include media: Optional (metadata only recommended for large chats)
   - Date range: Select desired range
5. **Export**: Wait for the process to complete
6. **Import**: Upload the generated JSON file in the import page

### Import Process

The import process includes:
1. **File Validation**: Checks format and size
2. **Data Parsing**: Extracts messages and metadata
3. **Database Storage**: Saves messages for search indexing
4. **Progress Tracking**: Real-time progress updates
5. **Completion Report**: Summary of imported data

## Configuration Options

### Complete Configuration Example

```yaml
# config/config.yaml
database:
  type: postgres
  host: localhost
  port: 5433
  user: postgres
  password: '123456'
  database: postgres

api:
  telegram:
    apiId: '611335'
    apiHash: 'd524b414d21f4d37f08684c1df41ac9c'
    botToken: '123456789:AAAA_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    receiveMessage: false
    
  embedding:
    provider: openai
    model: text-embedding-3-small
    apiKey: 'your_openai_api_key'
    dimension: 1536
```

### Environment Variables

You can also use environment variables:

```bash
export TELEGRAM_BOT_TOKEN="123456789:AAAA_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
export TELEGRAM_API_ID="611335"
export TELEGRAM_API_HASH="d524b414d21f4d37f08684c1df41ac9c"
```

## Troubleshooting

### Common Issues

#### "Invalid Bot Token"
- Verify the token format: `123456789:AAAA...`
- Ensure the bot hasn't been deleted in @BotFather
- Check for extra spaces or characters

#### "Import Failed"
- Verify the JSON file is from Telegram Desktop export
- Check file size (must be under 500MB)
- Ensure the file isn't corrupted

#### "No Messages Found"
- Bots can only see messages in groups they're members of
- Add your bot to the groups you want to search
- Import historical data manually using the export feature

### Getting Help

If you encounter issues:
1. Check the application logs for detailed error messages
2. Verify your configuration file syntax
3. Test with a simple export file first
4. Ensure your bot has the necessary permissions

## Best Practices

### Security
- Keep your bot token secure and private
- Don't share bot tokens in public repositories
- Rotate bot tokens periodically using @BotFather

### Performance
- Import data in smaller batches for large chat histories
- Use the embedding API efficiently (consider costs)
- Monitor database storage usage

### Organization
- Use descriptive bot names in @BotFather
- Document which bots are used for which purposes
- Keep export files organized by date and chat

## Migration from User Authentication

If you're switching from user authentication to bot authentication:

1. **Export Existing Data**: Use the takeout/sync feature before switching
2. **Backup Configuration**: Save your current config file
3. **Update Configuration**: Add bot token to existing config
4. **Test Import**: Start with a small chat export to verify functionality
5. **Bulk Import**: Import all required chat histories
6. **Verify Search**: Test search functionality with imported data

## Advanced Usage

### Multiple Bots
You can use multiple bots for different purposes:
- One bot for public channels
- Another bot for private groups
- Separate bots for different projects

### Automation
Consider automating exports using:
- Scheduled Telegram Desktop exports
- Scripts to process multiple JSON files
- Batch import workflows

### Integration
Bot mode integrates with all existing features:
- Vector search and semantic matching
- Full-text search capabilities
- Web interface and API access
- Export and backup functionality