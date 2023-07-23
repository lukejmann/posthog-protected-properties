import { Plugin, PluginEvent, PluginMeta } from '@posthog/plugin-scaffold'
// @ts-ignore
import { createPageview, resetMeta } from '@posthog/plugin-scaffold/test/utils'

import * as protectedPropertiesApp from '.'
import { generateHMAC } from './util'

const { processEvent } = protectedPropertiesApp as Required<Plugin>

const defaultMeta: protectedPropertiesApp.AppInterface = {
    config: {
        secret: 'secret',
        protectedProperties: 'is_admin,is_super',
    },
}

const createProtectedPageview = (hmac: string): PluginEvent => {
    const event = createPageview()

    const setProtectedProps = {
        is_admin: true,
        is_super: false,
    }

    const properties = {
        // @ts-ignore
        ...event.properties,
        protected_hmac: hmac,
        $set: setProtectedProps,
        $set_once: setProtectedProps,
    }
    return {
        ...event,
        uuid: 'uuid',
        properties,
        $set: setProtectedProps,
        $set_once: setProtectedProps,
    }
}

const verifyProtectedPropertiesAreRemoved = (event: PluginEvent): void => {
    // $set
    expect(event!.$set!.is_admin).toEqual(undefined)
    expect(event!.$set!.is_super).toEqual(undefined)

    // $set_once
    expect(event!.$set_once!.is_admin).toEqual(undefined)
    expect(event!.$set_once!.is_super).toEqual(undefined)

    // $set on event props
    expect(event!.properties!.$set!.is_admin).toEqual(undefined)
    expect(event!.properties!.$set!.is_super).toEqual(undefined)

    // $set_once on event props
    expect(event!.properties!.$set_once!.is_admin).toEqual(undefined)
    expect(event!.properties!.$set_once!.is_super).toEqual(undefined)

    // Event properties
    expect(event!.properties!.protected_hmac).toEqual(undefined)
}

describe('Protected properties', () => {
    test('Protected properties are removed when HMAC is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'warn').mockImplementation(() => {})
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const event = await processEvent(createProtectedPageview('invalid_hmac'), meta)
        verifyProtectedPropertiesAreRemoved(event!)
        expect(console.warn).toHaveBeenCalledWith('Invalid HMAC for protected properties')
    })

    test('Protected properties are removed when HMAC is invalid (invalid secret)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'warn').mockImplementation(() => {})
        const invalidSecretHMAC = generateHMAC('differentSecret', {
            is_admin: true,
            is_super: false,
        })
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const event = await processEvent(createProtectedPageview(invalidSecretHMAC), meta)
        verifyProtectedPropertiesAreRemoved(event!)
        expect(console.warn).toHaveBeenCalledWith('Invalid HMAC for protected properties')
    })

    test('Protected properties are removed when HMAC is not provided', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'warn').mockImplementation(() => {})
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const event = await processEvent(createProtectedPageview(''), meta)
        verifyProtectedPropertiesAreRemoved(event!)
        expect(console.warn).toHaveBeenCalledWith('Missing HMAC for protected properties')
    })

    test('Protected properties are kept when HMAC is valid', async () => {
        const validHMAC = generateHMAC(defaultMeta.config.secret, {
            is_admin: true,
            is_super: false,
        })
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const event = await processEvent(createProtectedPageview(validHMAC), meta)
        expect(event!.$set!.is_admin).toEqual(true)
        expect(event!.$set!.is_super).toEqual(false)
        expect(event!.$set_once!.is_admin).toEqual(true)
        expect(event!.$set_once!.is_super).toEqual(false)
    })
})

const createPageviewWithNonProtectedProps = (hmac: string): PluginEvent => {
    const event = createPageview()

    const setProps = {
        is_admin: true,
        is_super: false,
        non_protected_property: 'some value',
        hmac: hmac,
    }

    const properties = {
        // @ts-ignore
        ...event.properties,
        $set: setProps,
        $set_once: setProps,
    }
    return {
        ...event,
        uuid: 'uuid',
        properties,
        $set: setProps,
        $set_once: setProps,
    }
}

const verifyNonProtectedPropertyIsKept = (event: PluginEvent): void => {
    // $set
    expect(event!.$set!.non_protected_property).toEqual('some value')

    // $set_once
    expect(event!.$set_once!.non_protected_property).toEqual('some value')

    // $set on event props
    expect(event!.properties!.$set!.non_protected_property).toEqual('some value')

    // $set_once on event props
    expect(event!.properties!.$set_once!.non_protected_property).toEqual('some value')
}

describe('Non-protected properties', () => {
    test('Non-protected properties are not removed when no HMAC is provided', async () => {
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const event = await processEvent(createPageviewWithNonProtectedProps(''), meta)
        verifyNonProtectedPropertyIsKept(event!)
    })

    test('Non-protected properties are not removed when valid HMAC is provided', async () => {
        const validHMAC = generateHMAC(defaultMeta.config.secret, {
            is_admin: true,
            is_super: false,
        })
        const meta = resetMeta(defaultMeta) as PluginMeta<Plugin>
        const event = await processEvent(createPageviewWithNonProtectedProps(validHMAC), meta)
        verifyNonProtectedPropertyIsKept(event!)
    })
})
