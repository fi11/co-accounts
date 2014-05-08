var co = require('co');
var accounts = require('./../index');
var Backend = require('../lib/backend-stub');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var expect = require('chai').expect;

describe('"Update profile" method', function() {
    var store, acc;

    beforeEach(function() {
        store = {};
        var backend = new Backend(store);

        acc = accounts({ backend: backend, secretKey: 'shhh' });
    });


    it('Should update account profile', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });
            yield acc.updateProfile('admin', { fullName: 'New name' });

            expect(store['admin'].fullName).to.be.equal('New name');
        })(done);
    });

    it('Should throw error if attribute isn`t string, number, boolean', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            try {
                yield acc.updateProfile('admin', { fullName: {} });
            } catch (err) {
                expect(err).to.be.defined;
                done();
            }
        })();
    });

    it('Should throw error if one if attribute is login', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            try {
                yield acc.updateProfile('admin', { login: 'root', fullName: 'New Name' });
            } catch (err) {
                expect(err).to.be.defined;
                done();
            }
        })();
    });

    it('Should throw error if one if attribute is hash', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            try {
                yield acc.updateProfile('admin', { hash: 'hAsH', fullName: 'New Name' });
            } catch (err) {
                expect(err).to.be.defined;
                done();
            }
        })();
    });
});

describe('"Update account by token" method', function() {
    var store, acc;

    beforeEach(function() {
        store = {};
        var backend = new Backend(store);

        acc = accounts({ backend: backend, secretKey: 'shhh', tokenKey: 'secret'  });
    });

    it('Should update by token', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            var token = jwt.sign({ login: 'admin', attr: 'fullName', value: 'OK' }, 'secret');

            yield acc.updateByToken(token);
            expect(store['admin'].fullName).to.be.equal('OK');
        })(done);
    });

    it('Should return valid token', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            var token = jwt.sign({ login: 'admin', attr: 'fullName', value: 'OK' }, 'secret');

            var res = yield acc.updateByToken(token);

            var data = yield acc.jwtVerify(res, 'shhh');

            expect(data.login).to.be.equal('admin');
        })(done);
    });
});

describe('"Get update token" method', function() {
    var store, acc;

    beforeEach(function() {
        store = {};
        var backend = new Backend(store);

        acc = accounts({ backend: backend, secretKey: 'shhh', tokenKey: 'secret'  });
    });

    it('Should return valid update token', function(done) {
        var token = acc.getUpdateToken('admin', 'activate', true);

        jwt.verify(token, 'secret', function(err, data) {
            expect({ login: data.login, attr: data.attr, value: data.value }).to.deep.equal({
                login: 'admin',
                attr: 'activate',
                value: true
            });
            done();
        });
    });
});
