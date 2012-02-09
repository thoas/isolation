var express = require('express')
  , forms = require('./forms')
  , bcrypt = require('bcrypt')
  , utils = require('./utils')
  , redis = require('redis')
  , client = redis.createClient(6379, 'localhost')
  , mongoose = require('mongoose')
  , schema = require('./schema');

express.client = client;

var RedisStore = require('connect-redis')(express)
  , app = express.createServer(
    express.bodyParser()
    , express.cookieParser()
    , express.session({ store: new RedisStore(), secret: 'keyboard cat' })
);

mongoose.connect('mongodb://localhost/isolation');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });
app.dynamicHelpers({ messages: require('express-messages') });

function authenticate(username, password, fn) {
    mongoose.model('User').findOne({ username: username }, function(err, user) {
        if (user.password == utils.hash(password, user.salt)) {
            return fn(null, user);
        }

        return fn(new Error('invalid password'));
    });

    fn(new Error('User not found'));
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

app.get('/', function(req, res) {
    res.redirect('/login');
});

app.get('/restricted', restrict, accessLogger, function(req, res) {
    res.render('restricted', {
        'user': req.session.user
    })
});

app.get('/logout', function(req, res) {
    req.session.destroy(function() {
        res.redirect('home');
    });
});

app.get('/login', function(req, res) {
    if (req.session.user) {
        req.flash('success', 'Authenticated as ' + req.session.user.name
            + ' click to <a href="/logout">logout</a>. '
            + ' You may now access <a href="/restricted">/restricted</a>.');
    }
    res.render('login', {
        'authentication_form': forms.authentication
    });
});

app.get('/register', function(req, res) {
    res.render('registration', {
        'registration_form': forms.registration
    });
});

app.get('/user/delete/:id', function(req, res) {
    mongoose.model('User').findById(req.params.id, function(err, user) {
        user.remove();
        req.flash('success', user.username + ' has been removed');
        res.redirect('/users');
    });
});

app.get('/users', function(req, res) {
    mongoose.model('User').find({}, function(err, docs) {
        res.render('users', {
            'users': docs
        });
    });
});

app.post('/register', function(req, res) {
    forms.registration.handle(req, {
        success: function(form){
            var User = mongoose.model('User');

            user = new User();
            user.username = form.data.username;
            user.salt = bcrypt.genSaltSync(10);
            user.password = utils.hash(form.data.password, user.salt);
            user.email = form.data.email;

            user.save(function(err) {
                if (!err) {
                    req.flash('success', 'Your account has been registered');
                    res.redirect('/register');
                } else {
                    console.log(err);
                }
            })

        },
        // perhaps also have error and empty events
        other: function(form) {
            res.render('registration', {
                'registration_form': form
            });
        }
    });
});

app.post('/login', function(req, res) {
    forms.authentication.handle(req, {
        success: function(form){
            authenticate(req.body.username, req.body.password, function(err, user) {
                if (user) {
                    req.session.regenerate(function() {
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
        other: function(form) {
            res.render('login', {
                'authentication_form': form
            });
        }
    });
});

app.listen(3000);

console.log('Express started on port 3000');
