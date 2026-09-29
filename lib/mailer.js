import nodemailer from 'nodemailer'

function mailConfig() {
  return {
    mailer: String(process.env.MAIL_MAILER || 'log').trim().toLowerCase(),
    host: String(process.env.MAIL_HOST || '').trim(),
    port: Number(process.env.MAIL_PORT || 587),
    username: String(process.env.MAIL_USERNAME || '').trim(),
    password: String(process.env.MAIL_PASSWORD || ''),
    from: String(process.env.MAIL_FROM_ADDRESS || '').trim(),
    fromName: String(process.env.MAIL_FROM_NAME || process.env.APP_NAME || 'ElyTrack').trim()
  }
}

function applicationUrl() {
  const value = String(process.env.APP_URL || '').trim().replace(/\/$/, '')
  if (!value) throw new Error('APP_URL is required for account email links')
  return value
}

export function accountLink(path, token) {
  const url = new URL(path, `${applicationUrl()}/`)
  url.searchParams.set('token', token)
  return url.toString()
}

function assertRecipient(email) {
  const value = String(email || '').trim()
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error('A valid account email address is required')
  }
  return value
}

export async function sendAccountEmail({ to, subject, text, html }) {
  const recipient = assertRecipient(to)
  const config = mailConfig()
  if (/[\r\n]/.test(subject || '') || /[\r\n]/.test(config.from) || /[\r\n]/.test(config.fromName)) {
    throw new Error('Invalid email header value')
  }

  if (config.mailer === 'log') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MAIL_MAILER=log is not allowed in production')
    }
    // Do not log message bodies: invitation/reset links contain one-time raw tokens.
    console.info(`[mail] log delivery prepared: recipient=${recipient} subject=${JSON.stringify(subject)}`)
    return { accepted: true, mode: 'log' }
  }

  if (config.mailer !== 'smtp') throw new Error(`Unsupported MAIL_MAILER: ${config.mailer}`)
  if (!config.host || !config.from || !Number.isInteger(config.port) || config.port <= 0) {
    throw new Error('MAIL_HOST, MAIL_PORT, and MAIL_FROM_ADDRESS are required for SMTP delivery')
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: String(process.env.MAIL_SCHEME || '').trim().toLowerCase() === 'smtps' || config.port === 465,
    auth: config.username ? { user: config.username, pass: config.password } : undefined
  })
  const info = await transporter.sendMail({
    from: config.fromName ? `"${config.fromName.replace(/"/g, '')}" <${config.from}>` : config.from,
    to: recipient,
    subject,
    text,
    html
  })
  return { accepted: true, mode: 'smtp', messageId: info.messageId || '' }
}
