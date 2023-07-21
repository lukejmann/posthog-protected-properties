# 🛡️ Posthog Protected Properties Plugin

The Protected Properties plugin for PostHog provides a way to verify the integrity and authenticity of certain event properties using HMAC.

## Features

-   Protects specific event properties using an HMAC.
    -Verifies provided HMAC for each protected property, removing any properties where the HMAC is missing or invalid.
-   Ensures data integrity by preventing tampering with protected properties in transit.

## Configuration

-   secret: The private key used for generating HMACs.
-   protectedProperties: A comma-separated list of properties to protect.

## Usage

To use it simply install the app from the repository URL: https://github.com/lukejmann/posthog-protected-properties or search for it in the PostHog App Library.

When setting a protected property in your backend, provide an HMAC for the property. Include the HMAC in the $set properties with the key ${property}\_hmac.

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
