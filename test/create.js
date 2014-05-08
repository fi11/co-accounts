var co = require('co');
var accounts = require('./../index');
var Backend = require('../lib/backend-stub');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var expect = require('chai').expect;

describe('"Create" method', function() {
    var store, acc;

    beforeEach(function() {
        store = {};
        var backend = new Backend(store);

        acc = accounts({ backend: backend, secretKey: 'shhh' });
    });


    it('Should create account', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });
            var hash = bcrypt.hashSync('pwd', 10);

            expect(store['admin']).to.be.defined;
        })(done);

    });

    it('Should create account with right password', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            expect(bcrypt.compareSync('pwd', store['admin'].hash)).to.be.true;
        })(done);
    });

    it('Should create account with profile data', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            expect(store['admin'].fullName).to.be.equal('Admin');
        })(done);
    });

    it('Should create not activate account', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            expect(store['admin'].activate).to.be.false;
        })(done);
    });

    it('Should return auth token', function(done) {
        co(function *(){
            var res = yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            jwt.verify(res, 'shhh', function(e, data) {
                expect(data.login).to.be.equal('admin');
                done();
            });
        })();
    });

    it('Should return auth token with profile data', function(done) {
        co(function *(){
            var res = yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            jwt.verify(res, 'shhh', function(e, data) {
                expect(data.fullName).to.be.equal('Admin');
                done();
            });
        })();
    });

    it('Should throw error if account already exist', function(done) {
        co(function *(){
            yield acc.create('admin', 'pwd', { fullName: 'Admin' });

            try {
                yield acc.create('admin', 'pwd2', { fullName: 'Admin' });
            } catch (err) {
                expect(err.code).to.be.equal('EXIST_ERROR');
                done();
            }
        })();
    });
});
