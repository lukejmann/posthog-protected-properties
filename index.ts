import { Plugin } from '@posthog/plugin-scaffold'

import { deleteProtectedProperties, generateHMAC } from './util'

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

            if (!providedHMAC) {
                console.warn(`Dropping protected properties (no HMAC provided).`)
                return deleteProtectedProperties(protectedProperties, event)
            }

            for (const property of protectedProperties) {
                if (event.properties.$set_once && property in event.properties.$set_once) {
                    protectedPropertyValues[property] = event.properties.$set_once[property]
                }

                if (event.$set_once && property in event.$set_once) {
                    protectedPropertyValues[property] = event.$set_once[property]
                }

                if (event.properties.$set && property in event.properties.$set) {
                    protectedPropertyValues[property] = event.properties.$set[property]
                }

                if (event.$set && property in event.$set) {
                    protectedPropertyValues[property] = event.$set[property]
                }
            }

            const correctHMAC = generateHMAC(config.secret, protectedPropertyValues)
            if (providedHMAC !== correctHMAC) {
                console.warn(
                    `Dropping protected properties (invalid HMAC provided): ${Object.keys(protectedPropertyValues).join(
                        ', '
                    )}`
                )
                return deleteProtectedProperties(protectedProperties, event)
            }
        }

        return event
    },
}

module.exports = plugin
