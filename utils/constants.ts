export const ui = {
    panelHeight: 54,
    dockHeight: 70,
    windowMinWidth: 300,
    windowMinHeight: 200,
    defaultWindowWidth: 900,
    defaultWindowHeight: 600,
    mobileBreakpoint: 768,
    animationThrottleMs: 16,
    maxLoginAttempts: 5,
    loginLockoutDuration: 30000,
};

export const security = {
    pbkdf2Iterations: 100000,
    saltLength: 16,
    keyLength: 32,
    maxUploadSizeMB: 10,
};

export const api = {
    pistonExecuteUrl: 'https://emkc.org/api/v2/piston/execute',
    githubRawBaseUrl: 'https://raw.githubusercontent.com',
};
