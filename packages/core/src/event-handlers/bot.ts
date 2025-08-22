import type { CoreContext } from '../context'
import type { BotConnectionService, SessionService } from '../services'

import { useLogger } from '@unbird/logg'

export function registerBotEventHandlers(ctx: CoreContext) {
  const { emitter } = ctx
  const logger = useLogger('core:bot:event')

  return (
    configuredBotConnectionService: BotConnectionService,
    sessionService: SessionService,
  ) => {
    emitter.on('bot:login', async ({ botToken }) => {
      // Create a unique identifier for bot sessions
      const botPhoneNumber = `bot:${botToken.split(':')[0]}`
      const session = (await sessionService.loadSession(botPhoneNumber)).expect('Failed to load bot session')

      logger.withFields({ session, botId: botToken.split(':')[0] }).verbose('Loaded bot session')

      await configuredBotConnectionService.loginWithBot({ botToken, session })
      logger.verbose('Logged in to Telegram as bot')
    })

    emitter.on('bot:logout', async () => {
      logger.verbose('Logged out from Telegram bot')
      const client = ctx.getClient()
      if (client) {
        await configuredBotConnectionService.logout(client)
      }
    })
  }
}