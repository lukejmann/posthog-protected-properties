import * as crypto from 'crypto'
const stringify = require('json-stringify-deterministic')

export function generateHMAC(secret: string, properties: Record<string, any>): string {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(stringify(properties))
    return hmac.digest('hex')
}
