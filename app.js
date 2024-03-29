/**
 * Web Atelier 2021  Final Project : DoX
 *
 * Main Server Application
 *
 */


// require framework and middleware dependencies
const express = require('express');
const path = require('path');
const logger = require('morgan');
const methodOverride = require('method-override');
const fileUpload = require('express-fileupload');

// Application config import
const {webserver, cookie} = require('./config/config.js')
const crypto = require("crypto");
const { xss } = require('express-xss-sanitizer');

var setDomain = require('express-set-domain');

// Passport and Express-Session library
const passport = require('passport');
const session = require('express-session');
// Passport strategies for authentication
const passportStrategies = require('./modules/auth_strategies.js');


//Import the secondary "Strategy" library
const LocalStrategy = require('passport-local').Strategy;

// Custom middleware authentication and flash message view middleware 
const flash = require('connect-flash');
const serve_auth_info_toViews = require('./modules/auth_middleware/auth_info_views_middleware.js')


/////////////////////////////////////////////////////////////////////////////////////
// INIT framework
const app = express();


app.use(webserver.rate.generic_limiter)
app.use(logger('dev'));
app.use(xss()) // Parses req attributes to make sure they can't be considered part of an XSS attack
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: false}));    // parse application/x-www-form-urlencoded
app.use(express.json());    // parse application/json
app.use(methodOverride('_method'));
app.use(fileUpload());

require('./ejs-compile.js')

app.set('view engine', 'ejs');

// INIT session
app.sessionMid = session({
    secret: crypto.randomBytes(20).toString('hex'), // Regenerates the secret key everytime and therefore invalidates the previous stored cookies
    name:   cookie.name,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: cookie.expires
    }
})

app.set('trust proxy', 1)
app.use(app.sessionMid);

// INIT passport on every route call.
app.use(passport.initialize());
// allow passport to use "express-session".
app.use(passport.session());

// log-in
passport.use('local-login', new LocalStrategy(passportStrategies.authUser))

// register
passport.use('local-signup',
    new LocalStrategy(
        {passReqToCallback: true}, // we pass the re to the callback to be able to read the email (req.body.email)
        passportStrategies.registerUser)
);

// attach the {authenticate_user} to req.session.passport.user.{authenticated_user}
passport.serializeUser((userObj, done) => {
    done(null, userObj)
})
// get the {authenticated_user} for the session from "req.session.passport.user.{authenticated_user}, and attach it to req.user.{authenticated_user}
passport.deserializeUser((userObj, done) => {
    done(null, userObj)
})

// flash messages
app.use(flash());
// Custom middleware authentication and flash message view middleware
app.use(serve_auth_info_toViews);


/////////////////////////////////////////////////////////////////////////////////////
// CONTROLLERS
//this will automatically load all routers found in the routes folder
const routers = require('./routes');
const {Step} = require("prosemirror-transform");

app.use('/auth', routers.router_auth);
app.use('/', routers.root);

// Static folders
app.use('/', express.static('public'));

//default fallback handlers
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: err
    });
});


/////////////////////////////////////////////////////////////////////////////////////
// Start server
app.set('port', webserver.listen_port)

const server = require('http').createServer(app);

server.on('listening', function () {
    console.log(`Express server listening on port ${server.address().port}`);
});


module.exports = app