import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as os from 'node:os';

const execFileAsync = promisify(execFile);

export class MacOSKeychain {
  private serviceName: string;

  constructor(serviceName = 'berkelium') {
    this.serviceName = serviceName;
  }

  public isAvailable(): boolean {
    return os.platform() === 'darwin';
  }

  public async getPassword(account: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      const { stdout } = await execFileAsync('security', [
        'find-generic-password',
        '-s',
        this.serviceName,
        '-a',
        account,
        '-w',
      ]);
      return stdout.trim();
    } catch {
      return null;
    }
  }

  public async setPassword(account: string, password: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      // First delete existing password if any
      await this.deletePassword(account).catch(() => {});
      await execFileAsync('security', [
        'add-generic-password',
        '-s',
        this.serviceName,
        '-a',
        account,
        '-w',
        password,
        '-U',
      ]);
      return true;
    } catch {
      return false;
    }
  }

  public async deletePassword(account: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await execFileAsync('security', [
        'delete-generic-password',
        '-s',
        this.serviceName,
        '-a',
        account,
      ]);
      return true;
    } catch {
      return false;
    }
  }
}
