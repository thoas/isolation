var express = require('express')
  , forms = require('./forms')
  , utils = require('./utils')
  , app = express.createServer(
    express.bodyParser()
    , express.cookieParser()
    , express.session({ secret: 'keyboard cat' })
  , RedisStore = require('connect-redis')(express)
);


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });
app.dynamicHelpers({ messages: require('express-messages') });

var users = {
    thoas: {
        name: 'thoas'
        , salt: 'randomly-generated-salt'
        , pass: utils.hash('foobar', 'randomly-generated-salt')
    }
};

function authenticate(name, pass, fn) {
    var user = users[name];

    if (!user) {
        return fn(new Error('cannot find user'));
    }

    if (user.pass == utils.hash(pass, user.salt)) {
        return fn(null, user);
    }
    fn(new Error('invalid password'));
}

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Access denied!');
        res.redirect('/login');
    }
}

function accessLogger(req, res, next) {
    console.log('/restricted accessed by %s', req.session.user.name);
    next();
}

app.get('/', function(req, res){
    res.redirect('/login');
});

app.get('/restricted', restrict, accessLogger, function(req, res){
    res.render('restricted', {
        'user': req.session.user
    })
});

app.get('/logout', function(req, res){
    req.session.destroy(function(){
        res.redirect('home');
    });
});

app.get('/login', function(req, res){
    if (req.session.user) {
        req.flash('success', 'Authenticated as ' + req.session.user.name
            + ' click to <a href="/logout">logout</a>. '
            + ' You may now access <a href="/restricted">/restricted</a>.');
    }
    res.render('login', {
        'authentication_form': forms.authentication
    });
});

app.post('/login', function(req, res){
    forms.authentication.handle(req, {
        success: function(form){
            console.log(req);
            authenticate(req.body.username, req.body.password, function(err, user){
                if (user) {
                    req.session.regenerate(function(){
                        req.session.user = user;
                        res.redirect('back');
                    });
                } else {
                    req.flash('error', 'Authentication failed, please check your username and password.');
                    res.redirect('back');
                }
            });
        },
        // perhaps also have error and empty events
        other: function(form){
            res.render('login', {
                'authentication_form': form
            });
        }
    });
});

app.listen(3000);

console.log('Express started on port 3000');
