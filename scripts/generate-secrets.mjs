#!/usr/bin/env node

import { randomBytes } from 'node:crypto'

const base64Secret = randomBytes(32).toString('base64')
const databasePassword = randomBytes(24).toString('base64url')

console.log('# Copy these values only into your deployment secret manager.')
console.log('# Do not commit this output or place it in .env.example.')
console.log(`APP_KEY=base64:${base64Secret}`)
console.log(`DB_PASSWORD=${databasePassword}`)
console.log('')
console.log('# APP_KEY is provided for Laravel-compatible deployments.')
console.log('# ElyTrack itself currently authenticates through the database and does not consume APP_KEY.')
console.log('# DB_PASSWORD becomes active only after the MySQL user password is changed at the provider.')
