# Telegram Data Import Script

This script allows you to import Telegram chat history from JSON export files directly into the database.

## Usage

```bash
# Import a single file
pnpm run import:data ./path/to/ChatExport_001.json

# Import with custom chat ID
pnpm run import:data ./path/to/ChatExport_001.json my_custom_chat_id

# Show help
pnpm run import:data
```

## Features

- ✅ Supports Telegram Desktop JSON export format
- ✅ Batch processing with automatic error recovery
- ✅ Progress tracking and detailed logging
- ✅ Custom chat ID assignment
- ✅ Duplicate message detection and updating
- ✅ Memory-efficient processing for large files

## Requirements

- Node.js >= 22.18.0 (or adjust engine requirements)
- Configured database connection in `config/config.yaml`
- Valid Telegram export file in JSON format

## Exporting Data from Telegram Desktop

1. Open Telegram Desktop
2. Select the chat you want to export
3. Click the three-dot menu (⋮) → "Export chat history"
4. Select JSON format
5. Choose your export settings
6. Wait for export to complete
7. Use the generated JSON file with this script

## Examples

```bash
# Basic import
pnpm run import:data ./telegram_export.json

# Import with custom chat ID for organization
pnpm run import:data ./team_chat.json team_main_channel

# Batch import multiple files
for file in ./exports/*.json; do
  pnpm run import:data "$file"
done
```

## Notes

- The script automatically skips empty messages and invalid entries
- Large files are processed in batches of 100 messages
- Duplicate messages (same platform_message_id + chat_id) are updated, not duplicated
- All timestamps are preserved from the original export
- Progress is logged to console with detailed information

## Troubleshooting

**"Database not initialized"**
- Ensure your database is running and configured in `config/config.yaml`
- Run `pnpm run db:migrate` to apply database migrations

**"Invalid Telegram export format"**
- Verify the JSON file is from Telegram Desktop export
- Check that the file has a `messages` array

**"JSON parsing failed"**
- Check if the file is corrupted
- Verify file encoding is UTF-8
- Try exporting a smaller date range if the file is very large

For more help, see the main documentation in `docs/bot-authentication.md`.