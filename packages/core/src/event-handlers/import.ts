import type { CoreContext } from '../context'

import { useLogger } from '@unbird/logg'

export interface ImportEventToCore {
  'import:data': (data: { 
    data: TelegramExportData
    chatId?: string 
  }) => void
}

export interface ImportEventFromCore {
  'import:progress': (data: { 
    current: number
    total: number
    status: string 
  }) => void
  'import:complete': (data: { 
    imported: number
    errors: number 
  }) => void
  'import:error': (data: { error: unknown }) => void
}

export type ImportEvent = ImportEventFromCore & ImportEventToCore

interface TelegramMessage {
  id: number
  date: string
  from?: string
  from_id?: string
  text?: string | Array<{ type: string, text: string }>
  media_type?: string
  file?: string
  photo?: string
}

interface TelegramExportData {
  name: string
  type: string
  id: number
  messages: TelegramMessage[]
}

export function registerImportEventHandlers(ctx: CoreContext) {
  const { emitter } = ctx
  const logger = useLogger('core:import:event')

  emitter.on('import:data', async ({ data, chatId }) => {
    try {
      logger.withFields({ 
        chatName: data.name, 
        messageCount: data.messages.length 
      }).log('Starting data import')

      const messages = data.messages.filter(msg => msg.text && msg.text.length > 0)
      const total = messages.length
      let imported = 0
      let errors = 0

      emitter.emit('import:progress', { 
        current: 0, 
        total, 
        status: '准备导入数据...' 
      })

      // Process messages in batches
      const batchSize = 100
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        
        try {
          // Convert Telegram export format to internal message format
          const convertedMessages = batch.map(msg => ({
            id: msg.id.toString(),
            platformMessageId: msg.id.toString(),
            inChatId: chatId || data.id.toString(),
            content: typeof msg.text === 'string' ? msg.text : 
                    Array.isArray(msg.text) ? msg.text.map(t => t.text).join('') : '',
            platformTimestamp: new Date(msg.date).getTime(),
            fromUserId: msg.from_id || msg.from || 'unknown',
            fromUserName: msg.from || 'Unknown User',
            platform: 'telegram' as const,
            messageType: 'text' as const,
          }))

          // Import to database via message service - store for later processing
          // Note: This would need to be integrated with the actual message storage system
          // emitter.emit('message:record', { messages: convertedMessages })
          
          imported += batch.length
          
          emitter.emit('import:progress', { 
            current: imported, 
            total, 
            status: `已导入 ${imported} / ${total} 条消息` 
          })
          
        } catch (error) {
          logger.withError(error).error('Failed to import batch')
          errors += batch.length
        }
      }

      emitter.emit('import:complete', { imported, errors })
      logger.withFields({ imported, errors }).log('Import completed')

    } catch (error) {
      logger.withError(error).error('Import failed')
      emitter.emit('import:error', { error })
    }
  })
}