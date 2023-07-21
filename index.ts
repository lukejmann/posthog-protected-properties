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

        if (event.properties && event.properties.$set && protectedProperties) {
            for (const property of protectedProperties) {
                if (property in event.properties.$set) {
                    const providedHMAC = event.properties.$set[`${property}_hmac`]
                    if (!providedHMAC) {
                        delete event.properties.$set[property]
                        console.error(`Missing HMAC for protected property ${property}`)
                        continue
                    }

                    const correctHMAC = generateHMAC(config.secret, { [property]: event.properties.$set[property] })
                    if (providedHMAC !== correctHMAC) {
                        delete event.properties.$set[property]
                        console.error(`Invalid HMAC for protected property ${property}`)
                        continue
                    }
                }
            }
        }

        return event
    },
}

module.exports = plugin
