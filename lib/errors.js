exports.UPDATE_ERROR = getError('Can`t update account', 'UPDATE_ERROR');
exports.UPDATE_ATTRIBUTE_ERROR = getError('Invalid attribute value for update profile', 'UPDATE_ATTRIBUTE_ERROR');
exports.GET_ERROR = getError('Can`t get account from backend', 'GET_ERROR');
exports.CREATE_ERROR = getError('Can`t create account', 'CREATE_ERROR');
exports.EXIST_ERROR = getError('Account already exist', 'EXIST_ERROR');
exports.INVALID_TOKEN_ERROR = getError('Invalid activate token', 'INVALID_TOKEN_ERROR');

function getError(text, code) {
    return function(err) {
        if (!err) err = new Error();

        err.message = text;
        err.code = code;

        return err;
    };
}
