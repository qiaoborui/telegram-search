import type { ProxyConfig } from '@tg-search/common'
import type { Result } from '@unbird/result'
import type { ProxyInterface } from 'telegram/network/connection/TCPMTProxy'
import type { StringSession } from 'telegram/sessions'

import type { CoreContext } from '../context'

import { useLogger } from '@unbird/logg'
import { Err, Ok } from '@unbird/result'
import { TelegramClient } from 'telegram'

export interface BotConnectionEventToCore {
  'bot:login': (data: { botToken: string }) => void
  'bot:logout': () => void
}

export interface BotConnectionEventFromCore {
  'bot:connected': () => void
  'bot:error': (data: { error: unknown }) => void
}

export type BotConnectionEvent = BotConnectionEventFromCore & BotConnectionEventToCore

export type BotConnectionService = ReturnType<ReturnType<typeof createBotConnectionService>>

export function createBotConnectionService(ctx: CoreContext) {
  const { emitter, withError } = ctx

  return function (options: {
    apiId: number
    apiHash: string
    proxy?: ProxyConfig
  }) {
    const logger = useLogger('core:bot-connection')

    const getProxyInterface = (proxyConfig: ProxyConfig | undefined): ProxyInterface | undefined => {
      if (!proxyConfig)
        return undefined

      if (proxyConfig.MTProxy && proxyConfig.secret) {
        // MTProxy configuration
        return {
          ip: proxyConfig.ip,
          port: proxyConfig.port,
          MTProxy: true,
          secret: proxyConfig.secret,
          timeout: proxyConfig.timeout || 15, // Default timeout of 15 seconds
        }
      }

      // SOCKS proxy configuration
      return {
        ip: proxyConfig.ip,
        port: proxyConfig.port,
        socksType: proxyConfig.socksType || 5, // Default to SOCKS5
        timeout: proxyConfig.timeout || 15, // Default timeout of 15 seconds
        username: proxyConfig.username,
        password: proxyConfig.password,
      }
    }

    async function init(initOptions: {
      session: StringSession
    }): Promise<Result<TelegramClient>> {
      const { session } = initOptions

      const proxy = getProxyInterface(options.proxy)
      if (proxy) {
        logger.withFields({ proxy }).verbose('Using proxy')
      }

      const client = new TelegramClient(
        session,
        options.apiId,
        options.apiHash,
        {
          connectionRetries: 3,
          retryDelay: 10000,
          useWSS: proxy ? false : undefined,
          proxy,
        },
      )

      return Ok(client)
    }

    async function loginWithBot(loginOptions: {
      botToken: string
      session: StringSession
    }): Promise<Result<TelegramClient>> {
      const { botToken, session } = loginOptions

      try {
        const client = (await init({ session })).expect('Failed to initialize Telegram client')

        logger.verbose('Connecting to Telegram as bot')

        // Try to connect to Telegram by using the session
        const isConnected = await client.connect()
        if (!isConnected) {
          return Err(withError(new Error('Failed to connect to Telegram')))
        }

        // Authenticate as bot using bot token
        await client.signInBot({
          apiId: options.apiId,
          apiHash: options.apiHash,
        }, {
          botAuthToken: botToken,
        })

        logger.verbose('Successfully authenticated as bot')

        // NOTE: The client will return string session, so convert it directly
        const sessionString = await client.session.save() as unknown as string
        logger.withFields({ sessionString }).verbose('Saving bot session')

        emitter.emit('session:update', { phoneNumber: `bot:${botToken.split(':')[0]}`, session: sessionString })

        ctx.setClient(client)

        emitter.emit('bot:connected')

        // Emit me info for bot
        emitter.emit('entity:me:fetch')

        return Ok(client)
      }
      catch (error) {
        emitter.emit('bot:error', { error })
        return Err(withError(error, 'Failed to connect to Telegram as bot'))
      }
    }

    async function logout(client: TelegramClient) {
      if (client.connected) {
        await client.disconnect()
      }

      client.session.delete()
      logger.verbose('Logged out from Telegram bot')
      return Ok(null)
    }

    return {
      loginWithBot,
      logout,
    }
  }
}