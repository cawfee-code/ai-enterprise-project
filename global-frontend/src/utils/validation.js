const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}

export function getPasswordError(password) {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
    if (!/\d/.test(password)) return 'Password must include a number.';
    return null;
}