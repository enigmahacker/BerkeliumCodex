import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as os from 'node:os';
const execFileAsync = promisify(execFile);
export class MacOSKeychain {
    serviceName;
    constructor(serviceName = 'berkelium') {
        this.serviceName = serviceName;
    }
    isAvailable() {
        return os.platform() === 'darwin';
    }
    async getPassword(account) {
        if (!this.isAvailable())
            return null;
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
        }
        catch {
            return null;
        }
    }
    async setPassword(account, password) {
        if (!this.isAvailable())
            return false;
        try {
            // First delete existing password if any
            await this.deletePassword(account).catch(() => { });
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
        }
        catch {
            return false;
        }
    }
    async deletePassword(account) {
        if (!this.isAvailable())
            return false;
        try {
            await execFileAsync('security', [
                'delete-generic-password',
                '-s',
                this.serviceName,
                '-a',
                account,
            ]);
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=keychain.js.map