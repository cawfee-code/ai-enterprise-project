const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const isStrongPassword = (password) => {
    return typeof password === 'string' && PASSWORD_REGEX.test(password);
};

module.exports = { isStrongPassword };