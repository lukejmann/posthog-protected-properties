import { Plugin, PluginEvent, PluginMeta } from '@posthog/plugin-scaffold'
// @ts-ignore
import { createPageview, resetMeta } from '@posthog/plugin-scaffold/test/utils'

import * as protectedPropertiesApp from '.'
import { generateHMAC } from './util'
const { processEvent } = protectedPropertiesApp as Required<Plugin>

const defaultMeta: protectedPropertiesApp.AppInterface = {
    config: {
        secret: 'secret',
        protectedProperties: 'seon_blocked',
    },
}

const createProtectedPageview = (): PluginEvent => {
    const event = createPageview()

    const setProtectedProps = {
        seon_blocked: true,
        seon_blocked_hmac: 'invalid_hmac',
    }

    const properties = {
        // @ts-ignore
        ...event.properties,
        $set: setProtectedProps,
    }
    return {
        ...event,
        uuid: 'uuid',
        properties,
        $set: setProtectedProps,
    }
}

const verifyProtectedPropertyIsRemoved = (event: PluginEvent): void => {
    // $set
    expect(event!.$set!.seon_blocked).toEqual(undefined)
    expect(event!.$set!.seon_blocked_hmac).not.toEqual(undefined)

    // $set on event props
    expect(event!.properties!.$set!.seon_blocked).toEqual(undefined)
    expect(event!.properties!.$set!.seon_blocked_hmac).not.toEqual(undefined)
}

describe('Protected property', () => {
    test('Protected property is removed when HMAC is invalid', async () => {
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const event = await processEvent(createProtectedPageview(), meta)
        verifyProtectedPropertyIsRemoved(event!)
    })

    test('Protected property is kept when HMAC is valid', async () => {
        const validHMAC = generateHMAC(defaultMeta.config.secret, {
            seon_blocked: true,
        })
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const preprocessedEvent = createProtectedPageview()
        preprocessedEvent.$set!.seon_blocked_hmac = validHMAC
        // @ts-ignore
        preprocessedEvent.properties.$set!.seon_blocked_hmac = validHMAC
        const event = await processEvent(preprocessedEvent, meta)
        expect(event!.$set!.seon_blocked).toEqual(true)
        expect(event!.properties!.$set!.seon_blocked).toEqual(true)
    })
})
