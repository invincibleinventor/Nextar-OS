const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

const generateSalt = (): Uint8Array => {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};

const arrayToHex = (arr: Uint8Array): string => {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

const hexToArray = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
};

const deriveKey = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        KEY_LENGTH * 8
    );

    return new Uint8Array(derivedBits);
};

export const hashPassword = async (password: string, existingSalt?: string): Promise<string> => {
    const salt = existingSalt ? hexToArray(existingSalt) : generateSalt();
    const derivedKey = await deriveKey(password, salt);
    const saltHex = arrayToHex(salt);
    const keyHex = arrayToHex(derivedKey);
    return `${saltHex}:${keyHex}`;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
    const [saltHex, expectedKeyHex] = storedHash.split(':');
    if (!saltHex || !expectedKeyHex) {
        const legacyHash = await legacyHashPassword(password);
        return constantTimeEqual(legacyHash, storedHash);
    }
    const hash = await hashPassword(password, saltHex);
    const [, actualKeyHex] = hash.split(':');
    return constantTimeEqual(actualKeyHex, expectedKeyHex);
};

const legacyHashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

const constantTimeEqual = (a: string, b: string): boolean => {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
};

export const hashCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

export const verifyHash = async (code: string, expectedHash: string): Promise<boolean> => {
    const actualHash = await hashCode(code);
    return constantTimeEqual(actualHash, expectedHash);
};
