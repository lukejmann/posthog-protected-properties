import { Plugin } from '@posthog/plugin-scaffold'

import { generateHMAC } from './util'

export interface AppInterface {
    config: {
        secret: string
        protectedProperties: string
    }
}

const plugin: Plugin<AppInterface> = {
    processEvent: async (event, { config }) => {
        const protectedProperties = config.protectedProperties?.split(',').map((val) => val.trim())
        const protectedPropertyValues: Record<string, unknown> = {}

        if (event.properties && protectedProperties) {
            const providedHMAC = event.properties.protected_hmac
            delete event.properties.protected_hmac

            if (event.properties.$set) {
                for (const property of protectedProperties) {
                    if (property in event.properties.$set) {
                        protectedPropertyValues[property] = event.properties.$set[property]
                    }
                }
            }

            if (event.properties.$set_once) {
                for (const property of protectedProperties) {
                    if (property in event.properties.$set_once) {
                        protectedPropertyValues[property] = event.properties.$set_once[property]
                    }
                }
            }

            if (!providedHMAC) {
                for (const property of protectedProperties) {
                    if (event.properties.$set) {
                        delete event.properties.$set[property]
                    }
                    if (event.properties.$set_once) {
                        delete event.properties.$set_once[property]
                    }
                }
                console.warn(`Missing HMAC for protected properties`)
                return event
            }

            const correctHMAC = generateHMAC(config.secret, protectedPropertyValues)
            if (providedHMAC !== correctHMAC) {
                for (const property of protectedProperties) {
                    if (event.properties.$set) {
                        delete event.properties.$set[property]
                    }
                    if (event.properties.$set_once) {
                        delete event.properties.$set_once[property]
                    }
                }
                console.warn(`Invalid HMAC for protected properties`)
            }
        }

        return event
    },
}

module.exports = plugin
