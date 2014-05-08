var co = require('co');
var accounts = require('./../index');
var Backend = require('../lib/backend-stub');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var expect = require('chai').expect;

describe('"Set roles" method', function() {
    var store, acc;

    beforeEach(function() {
        store = {};
        var backend = new Backend(store);

        acc = accounts({ backend: backend, secretKey: 'shhh' });
    });


    it('Should set roles to account', function(done) {
        co(function *(){
            yield acc.create('user', 'pwd', { fullName: 'Admin' });

            yield acc.updateRoles('user', ['manager']);

            expect(store['user'].roles).to.be.deep.equal(['manager']);
        })(done);
    });

    it('Should add role to account when type add', function(done) {
        co(function *(){
            yield acc.create('user', 'pwd', { fullName: 'Admin', roles: ['admin'] });

            yield acc.updateRoles('user', 'manager', 'add');

            expect(store['user'].roles).to.be.deep.equal(['admin', 'manager']);
        })(done);
    });

    it('Should add roles to account when roles is array', function(done) {
        co(function *(){
            yield acc.create('user', 'pwd', { fullName: 'Admin', roles: ['admin'] });

            yield acc.updateRoles('user', ['manager', 'superUser'], 'add');

            expect(store['user'].roles).to.be.deep.equal(['admin', 'manager', 'superUser']);
        })(done);
    });

    it('Should remove role from account when type remove', function(done) {
        co(function *(){
            yield acc.create('user', 'pwd', { fullName: 'Admin', roles: ['admin'] });

            yield acc.updateRoles('user', 'admin', 'remove');

            expect(store['user'].roles).to.be.deep.equal([]);
        })(done);
    });

    it('Should remove all roles in list from account when type remove', function(done) {
        co(function *(){
            yield acc.create('user', 'pwd', { fullName: 'Admin', roles: ['admin', 'manager', 'superUser'] });

            yield acc.updateRoles('user', ['manager', 'superUser'], 'remove');

            expect(store['user'].roles).to.be.deep.equal(['admin']);
        })(done);
    });
});
