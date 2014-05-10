var accounts = require('./../index');
var Backend = require('../lib/backend-stub');

var co = require('co');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

var expect = require('chai').expect;

var thunkify = require('thunkify');
var bcryptHash = thunkify(bcrypt.hash);

describe('"Get reset token" method', function() {
    var store, acc;

    beforeEach(function() {
        store = {};
        var backend = new Backend(store);

        acc = accounts({ backend: backend, secretKey: 'shhh', tokenKey: 'secret' });
    });

    it('Should return valid reset password token', function(done) {
        co(function *(){
            var token = yield acc.getResetToken('admin', 'pwd');

            jwt.verify(token, 'secret', function(err, data) {
                expect(data.login).to.be.equal('admin');
                done();
            });
        })();
    });

    it('Should return reset password token with valid password hash', function(done) {
        co(function *(){
            var token = yield acc.getResetToken('admin', 'pwd');

            jwt.verify(token, 'secret', function(err, data) {
                expect(bcrypt.compareSync('pwd', data.value)).to.be.true;
                done();
            });
        })();
    });
});
