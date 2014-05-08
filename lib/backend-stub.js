var Backend = function(store) {
    this.get = get.bind(store);
    this.create = create.bind(store);
    this.update = update.bind(store);
};

function get(login, fn) {
    fn(null, this[login]);
}

function create(login, data, fn) {
    data = data || {};

    data.activate = false;
    data.login  = login;

    this[login] = data;
    fn(null, data);
}

function update(login, data, fn) {
    var roles = data.roles;

    if (roles) {
        delete data.roles;

        if (roles.add)
            this[login]['roles'] = (this[login]['roles'] || []).concat(roles.add);
        else if (roles.remove) {
            var newRoles = [];
            var blackList = [].concat(roles.remove);

            (this[login]['roles'] || []).forEach(function(item) {
                if (!~blackList.indexOf(item)) newRoles.push(item);
            });
            this[login].roles = newRoles;
        }
        else
            this[login]['roles'] = roles;
    }

    for(var key in data) {
        this[login][key] = data[key];
    }

    fn(null, this[login]);
}

module.exports = Backend;
