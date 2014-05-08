var ERROR = require('./lib/errors');

var bcrypt = require('bcryptjs');
var thunkify = require('thunkify');
var jwt = require('jsonwebtoken');

var bcryptCompare = thunkify(bcrypt.compare);
var bcryptHash = thunkify(bcrypt.hash);

module.exports = function auth(options) {
    var backend = options.backend;
    var keyAuth = options.secretKey;
    var keyToken = options.tokenKey || keyAuth;

    var rounds = options.rounds || 10;
    var optionsTokenAccount = { expiresInMinutes: options.expiresToken };

    var profileFields = options.profile || ['fullName', 'email', 'roles', 'activate', 'deactivate'];

    // Backend methods
    var createAccount = thunkify(backend.create);
    var updateAccount = thunkify(backend.update);
    var getAccount = thunkify(backend.get);

    function getProfile(data) {
        var profile = {};
        if (!data) return profile;

        profileFields.forEach(function(key) {
            var value = data[key];

            if (value) profile[key] = value;
        });

        return profile;
    }

    function *verify(login, pwd) {
        var account;

        try {
            account = yield getAccount(login);
        } catch(err) {
            throw ERROR.GET_ERROR(err);
        }

        if(!account) return false;

        var isVerify = yield bcryptCompare(pwd, account.hash);

        var profile = getProfile(account);

        if (!profile.login) profile.login = login;

        return isVerify ?
            jwt.sign(profile, keyAuth, optionsTokenAccount) :
            false;
    }

    function *setPassword(login, pwd) {
        var hash = yield bcryptHash(pwd, rounds);

        try {
            yield updateAccount(login, { hash: hash });
        } catch (err) {
            throw ERROR.UPDATE_ERROR(err);
        }
    }

    function *create(login, pwd, data) {
        var account = yield getAccount(login);

        if (account) throw ERROR.EXIST_ERROR(new Error());

        var hash = yield bcryptHash(pwd, rounds);

        try {
            account = yield createAccount(login, merge({ hash: hash }, merge(data, { activate: false })));
        } catch (err) {
            throw ERROR.CREATE_ERROR(err);
        }

        var profile = getProfile(account);

        if (!profile.login) profile.login = login;

        var token = jwt.sign(profile, keyAuth, optionsTokenAccount);

        return token;
    }

    function *getResetToken(login, pwd, expiresInMinutes) {
        var hash = yield bcryptHash(pwd, rounds);

        return getUpdateToken(login, 'hash', hash, expiresInMinutes || 60 * 24 * 7);
    }

    function *updateProfile(login, data) {
        if (data.hasOwnProperty('login') || data.hasOwnProperty('roles') || data.hasOwnProperty('hash'))
            throw ERROR.UPDATE_ATTRIBUTE_ERROR(new Error());

        for (var key in data) {
            var typeValue = typeof data[key];

            if (!~['string', 'number', 'boolean'].indexOf(typeValue))
                throw ERROR.UPDATE_ATTRIBUTE_ERROR(new Error());
        }

        try {
            yield updateAccount(login, data);
        } catch (err) {
            throw ERROR.UPDATE_ERROR(err);
        }
    }

    function *updateByToken(token) {
        var data, updateData = {};

        try {
            data = yield jwtVerify(token, keyToken);
            if (!data.login || !data.attr || !data.hasOwnProperty('value')) throw ERROR.INVALID_TOKEN_ERROR(new Error());
        } catch (err) {
            //TODO: debug log;
            return;
        }

        try {
            updateData[data.attr] = data.value;
            var account = yield updateAccount(data.login, updateData);

            var profile = getProfile(account);
            if(!profile.login) profile.login = data.login;

            return jwt.sign(profile, keyAuth, optionsTokenAccount);
        } catch (err) {
            //TODO: debug log;
            throw ERROR.UPDATE_ERROR(err);
        }
    }

    function getUpdateToken(login, attr, value, expiresInMinutes) {
        var token = jwt.sign(
            { login: login, attr: attr, value: value },
            keyToken,
            { expiresInMinutes: expiresInMinutes || 60 * 24 * 14 });

        return token;
    }

    function *updateRoles(login, roles, type) {
        var data;

        if (type === 'add')
            data = { add: [].concat(roles) };
        else if (type === 'remove')
            data = { remove: [].concat(roles) };
        else
            data = [].concat(roles);

        try {
            yield updateAccount(login, { roles: data });
            return true;
        } catch (err) {
            //TODO: debug log;
            throw ERROR.UPDATE_ERROR(err);
        }
    }

    return {
        verify: verify,
        setPassword: setPassword,
        create: create,
        getResetToken: getResetToken,
        updateProfile: updateProfile,
        getUpdateToken: getUpdateToken,
        updateByToken: updateByToken,
        updateRoles: updateRoles,
        jwtVerify: jwtVerify
    };
};

function merge(obj1, obj2) {
    var newObj = {};

    for(var key in obj1) newObj[key] = obj1[key];
    for(var key in obj2) newObj[key] = obj2[key];

    return newObj;
}

function jwtVerify(token, secretOrPublicKey, options) {
    return function(fn) {
        jwt.verify(token, secretOrPublicKey, options, function(err, data) {
            if (err) fn(err); else fn(null, data);
        });
    }
}
