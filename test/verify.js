var co = require('co');
var accounts = require('./../index');
var jwt = require('jsonwebtoken');
var Backend = require('../lib/backend-stub');
var expect = require('chai').expect;

describe('"Verify" method', function() {
    var store, acc;

    beforeEach(function() {
        store = {};
        var backend = new Backend(store);

        acc = accounts({ backend: backend, secretKey: 'shhh' });
    });

    it('Should return auth token when login and password is right', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            var token = yield acc.verify('admin', 'pwd');

            jwt.verify(token, 'shhh', function(err, data) {
                expect(data.login).to.be.equal('admin');
                done();
            });
        })();
    });

    it('Should return false when login and password is wrong', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            var token = yield acc.verify('admin', 'wRonGpWd');

            expect(token).to.be.false;
        })(done);
    });

    it('Should return false when account exist', function(done) {
        co(function *(){
            yield acc.create('admin2', 'pwd', { fullName: 'Admin' });

            var token = yield acc.verify('root', 'pwd');

            expect(token).to.be.false;
        })(done);
    });
});
