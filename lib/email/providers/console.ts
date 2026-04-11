import type { IEmailProvider, EmailMessage } from '../provider';

export class ConsoleEmailProvider implements IEmailProvider {
  readonly name = 'console';

  async send(message: EmailMessage): Promise<void> {
    // Intentionally minimal for MVP; swap with Nodemailer/Resend without touching core logic.
    // eslint-disable-next-line no-console
    console.info('[email:console]', { to: message.to, subject: message.subject });
  }
}

