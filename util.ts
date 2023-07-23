import { PluginEvent } from '@posthog/plugin-scaffold'
import * as crypto from 'crypto'
const stringify = require('json-stringify-deterministic')

export function generateHMAC(secret: string, properties: Record<string, unknown>): string {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(stringify(properties))
    return hmac.digest('hex')
}

export function deleteProtectedProperties(protectedProperties: string[], event: PluginEvent): PluginEvent {
    for (const property of protectedProperties) {
        if (event.$set) {
            delete event.$set[property]
        }

        if (event.$set_once) {
            delete event.$set_once[property]
        }

        if (event.properties?.$set) {
            delete event.properties.$set[property]
        }

        if (event.properties?.$set_once) {
            delete event.properties.$set_once[property]
        }
    }
    return event
}
