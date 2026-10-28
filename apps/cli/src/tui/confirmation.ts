import * as readline from 'node:readline/promises';

export interface ConfirmationRequest {
  message: string;
}

export type InteractiveConfirmationHandler = (
  request: ConfirmationRequest
) => Promise<boolean>;

export class ConfirmationManager {
  private interactiveHandler?: InteractiveConfirmationHandler;

  public setInteractiveHandler(handler: InteractiveConfirmationHandler): void {
    this.interactiveHandler = handler;
  }

  public async confirm(request: ConfirmationRequest): Promise<boolean> {
    if (this.interactiveHandler) {
      return this.interactiveHandler(request);
    }

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      return false;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      const answer = await rl.question(`${request.message} [y/N] `);
      return /^(?:y|yes)$/i.test(answer.trim());
    } finally {
      rl.close();
    }
  }
}
