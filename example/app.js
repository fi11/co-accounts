var koa = require('koa');
var router = require('koa-router');

var parse = require('co-body');
var qs = require('querystring');

var app = koa();
var store = {};
var Backend = require('../lib/backend-stub');

var acc = require('../index')({
    backend: new Backend(store),
    secretKey: 'shhh' ,
    tokenKey: 'shhhh'
});

app.use(router(app));
app.get('/', home);
app.get('/login', login);
app.get('/secret', secret);
app.post('/signup', signup);
app.post('/signin', signin);
app.get('/activate', activate);

app.listen(8000);

function *home() {
    this.body = [
        '<div style="margin-left: 60px">',
        '<h1>Create account</h1>',
        '<form action="/signup" method="POST">',
        '<p><input name="email" placeholder="input e-mail"></p>',
        '<p><input name="name" placeholder="input your name"></p>',
        '<p><input type="password" name="password" placeholder="input password"></p>',
        '<p><button type="submit">Create account</button></p>',
        '<p><a href="/login">Sing in</a></p>',
        '<p><a href="/secret">Secret page</a></p>',
        '</form>',
        '</div>'
    ].join('');
}

function *signup() {
    var body = yield parse(this);
    if(!body.email || !body.password) this.throw(500);

    var token = yield acc.create(body.email, body.password, { fullName: body.name });

    this.redirect('/secret/?token=' + token);
}

function *secret() {
    var profile, activateToken, token = qs.parse(this.querystring).token;

    try {
        profile = yield acc.jwtVerify(token, 'shhh');
        if (!store[profile.login]) throw new Error();
    } catch (err) {
        this.throw(401);
    }

    if (!profile.activate) activateToken = acc.getUpdateToken(profile.login, 'activate', true, 1);

    this.body = ['' +
        '<div style="margin-left: 60px">',
        '<h1>Secret page</h1>',
        '<h4>Your profile:</h4>',
        '<p>login: '+ profile.login +'</p>',
        '<p>name: '+ profile.fullName +'</p>',
        '<p>is activate: '+ (activateToken ? 'no': 'yes') +'</p>',
        activateToken ? '<p><a href="/activate/?token='+ activateToken +'">Activate link</a></p>' : '',
        '</div>'
    ].join('');
}

function *signin() {
    var body = yield parse(this);
    if(!body.email || !body.password) this.throw(401);

    try {
        var token = yield acc.verify(body.email, body.password);
    } catch (err) {
        this.throw(401);
    }

    this.redirect('/secret/?token=' + token);
}

function *login() {
    this.body = [
        '<div style="margin-left: 60px">',
        '<h1>Sing in page</h1>',
        '<form action="/signin" method="POST">',
        '<p><input name="email" placeholder="input e-mail"></p>',
        '<p><input type="password" name="password" placeholder="input password"></p>',
        '<p><button type="submit">Sign in</button></p>',
        '</form>',
        '</div>'
    ].join('');
}

function *activate() {
    var token = qs.parse(this.querystring).token;

    var res = yield acc.updateByToken(token);

    if (!res)
        this.body = 'Sorry bad token';
    else
        this.redirect('/secret/?token=' + res);
}
