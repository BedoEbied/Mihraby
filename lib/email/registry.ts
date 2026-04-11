import type { IEmailProvider } from './provider';
import { ConsoleEmailProvider } from './providers/console';

export function getEmailProvider(): IEmailProvider {
  const selected = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
  switch (selected) {
    case 'console':
      return new ConsoleEmailProvider();
    default:
      throw new Error(`Unsupported email provider: ${selected}`);
  }
}

