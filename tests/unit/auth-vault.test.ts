import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { AuthStore } from '@berkelium/auth';

describe('Encrypted credential vault', () => {
  let tempDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-auth-vault-'));
    vaultPath = path.join(tempDir, 'auth-vault.json');
    delete process.env.BERKELIUM_VAULT_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.BERKELIUM_VAULT_KEY;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createStore(): AuthStore {
    const store = new AuthStore({ vaultPath });
    vi.spyOn(store['keychain'], 'getPassword').mockResolvedValue(null);
    vi.spyOn(store['keychain'], 'setPassword').mockResolvedValue(false);
    vi.spyOn(store['keychain'], 'deletePassword').mockResolvedValue(false);
    return store;
  }

  it('stores provider keys as authenticated ciphertext and round-trips them', async () => {
    const provider = 'testprovider';
    const secret = 'sk-test-super-secret-credential-value';
    const store = createStore();

    await store.setApiKey(provider, secret);

    const rawVault = fs.readFileSync(vaultPath, 'utf-8');
    expect(rawVault).not.toContain(secret);
    expect(rawVault).not.toContain(`"${provider}"`);

    const envelope = JSON.parse(rawVault);
    expect(envelope).toMatchObject({
      version: 1,
      algorithm: 'aes-256-gcm',
    });
    expect(envelope.iv).toEqual(expect.any(String));
    expect(envelope.tag).toEqual(expect.any(String));
    expect(envelope.data).toEqual(expect.any(String));

    const keyPath = `${vaultPath}.key`;
    expect(fs.existsSync(keyPath)).toBe(true);
    expect(fs.statSync(keyPath).mode & 0o777).toBe(0o600);
    expect(fs.statSync(vaultPath).mode & 0o777).toBe(0o600);

    expect(await store.getApiKey(provider)).toBe(secret);
    expect(await createStore().getApiKey(provider)).toBe(secret);
  });

  it('migrates a legacy plaintext vault only into encrypted persistence', async () => {
    const secret = 'legacy-provider-secret';
    fs.writeFileSync(vaultPath, JSON.stringify({ legacyprovider: secret }, null, 2), {
      mode: 0o600,
    });

    const store = createStore();
    expect(await store.getApiKey('legacyprovider')).toBe(secret);

    const migrated = fs.readFileSync(vaultPath, 'utf-8');
    expect(migrated).not.toContain(secret);
    expect(JSON.parse(migrated).version).toBe(1);
    expect(await createStore().getApiKey('legacyprovider')).toBe(secret);
  });

  it('keeps the plaintext vault intact when encrypted migration cannot complete', async () => {
    const original = JSON.stringify({ brokenprovider: 'must-not-be-lost' }, null, 2);
    fs.writeFileSync(vaultPath, original, { mode: 0o600 });
    fs.mkdirSync(`${vaultPath}.key`);

    const store = createStore();
    await expect(store.getApiKey('brokenprovider')).rejects.toThrow(
      /Failed to (?:save|decrypt) the encrypted credential vault|EISDIR/
    );

    expect(fs.readFileSync(vaultPath, 'utf-8')).toBe(original);
  });

  it('rejects a vault encrypted with a different key without exposing plaintext', async () => {
    const secret = 'tamper-detection-secret';
    const store = createStore();
    await store.setApiKey('tamperprovider', secret);

    fs.writeFileSync(`${vaultPath}.key`, crypto.randomBytes(32).toString('base64'), {
      mode: 0o600,
    });

    await expect(createStore().getApiKey('tamperprovider')).rejects.toThrow(
      /Failed to decrypt credential vault/
    );
    expect(fs.readFileSync(vaultPath, 'utf-8')).not.toContain(secret);
  });

  it('removes credentials from both keychain and encrypted vault on logout', async () => {
    const provider = 'logoutprovider';
    const secret = 'logout-secret-value';
    const store = createStore();

    await store.setApiKey(provider, secret);
    await store.removeApiKey(provider);

    expect(store['keychain'].deletePassword).toHaveBeenCalledWith(provider);
    expect(await store.getApiKey(provider)).toBeNull();
    expect(await createStore().getApiKey(provider)).toBeNull();
    expect(fs.readFileSync(vaultPath, 'utf-8')).not.toContain(secret);
  });
});
