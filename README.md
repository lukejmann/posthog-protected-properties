# 🛡️ Posthog Protected Properties Plugin

The Protected Properties plugin for PostHog provides a way to verify the integrity and authenticity of certain event properties using HMAC.

## Features

-   Protects specific event properties using an HMAC, allowing only authorized services with the secret key to modify these properties.
-   Ensures data integrity by preventing tampering with protected properties in transit.

## Motivation

Consider an application where certain features or content are only available to users who have a paid subscription. To manage access, you might use a property like has_paid_subscription in PostHog. However, since product analytics software like PostHog inherently allows users to send events, a user could send a crafted event to change their has_paid_subscription status and gain unauthorized access.

This plugin requires a correct HMAC, which only a service knowing the secret key can generate, for updating any protected properties.

## Configuration

-   secret: The private key used for generating HMACs.
-   protectedProperties: A comma-separated list of properties to protect.

## Usage

To use it simply install the app from the repository URL: https://github.com/lukejmann/posthog-protected-properties or search for it in the PostHog App Library.

To set protected properties, you need to generate an HMAC for all the properties you want to protect. Include this HMAC in the $set or $set_once properties with the key hmac.

The properties that should be protected are defined in the plugin configuration in the protectedProperties field. In the event processing, the plugin checks the provided HMAC against one generated from the protected properties.

If the provided HMAC is missing or doesn't match the generated one, the plugin will remove the protected properties from the event.

Here is an example of how you might set protected properties and their HMAC:

```
// Define the protected properties
const protectedProperties: Record<string, any> = {
    is_admin: true,
    has_paid_subscription: false,
};

// Generate the HMAC for the protected properties
const hmac = crypto.createHmac('sha256', secret).update(stringify(protectedProperties)).digest('hex');

// Include the protected properties and their HMAC in the event properties
const properties: Record<string, any> = {
    $set: {
        ...protectedProperties,
        hmac: hmac,
    },
}
```

## Development & testing

Contributions are welcomed! Feel free to open a PR or an issue. To develop locally and contribute to this package, you can simply follow these instructions after cloning the repo.

-   Install dependencies
    ```bash
    yarn install
    ```
-   Run tests
    ```bash
    yarn test
    ```
-   Install app in your local instance by going to `/project/apps` in your PostHog instance, clicking on the "Advanced" tab and entering the full path where you cloned the repo.

Copyright (C) 2022 Luke Mann
