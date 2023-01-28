import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { engine as exphbs } from 'express-handlebars';
import { Server }  from 'socket.io';
import { createServer } from 'http';
import * as db from './src/db/mongodb/mongo.js';
import { matchPassword } from './src/db/mongodb/sessions.js';
import UserModel from './src/db/mongodb/sessions.js';
import { ProductsOptions } from './src/db/sqlite3/connection/connection.js';
import ProductsClienteSQL from './src/db/sqlite3/classes/ProductsClass.js';

const app = express();

db.connect();

const dbClass = new db.Mongo;

//----- DIRNAME -----//

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//----- PASSPORT -----//

passport.use('register', new LocalStrategy({ passReqToCallback: true }, async (req, username, password, done) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ "username": username });

    if (user) {
        return done(null, false, 'That user has already register')
    }

    console.log(req.session);
    const newUser = await UserModel.create({username,password,email})

    done(null, newUser);
}))

passport.use('login', new LocalStrategy( async (username, password, done) => {
    let user = await UserModel.findOne({ "username": username })

    if (!user) {
        return done(null, false, 'This user not exist')
    }

    const isMatch = await matchPassword(password, user.password);
    if (!isMatch) return done(null, false, 'Incorrect password');

    done(null, user)
}))

passport.serializeUser((user, done) => {
    done(null, user.username)
})

passport.deserializeUser(async (username, done) => {
    const user = UserModel.findOne({ "username": username });

    done(null, user)
})

app.use(session({
    secret: 'esteesmisecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000
    }
}))

app.use(passport.initialize())
app.use(passport.session())

//----- JSON -----//

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src'));

//----- HBS -----//

app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main.hbs' }))
app.set('views', path.join(__dirname, '/src/views'));
app.set('view engine', '.hbs')

//----- FUCNTIONS -----//

function requireAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/login')
    }
}

//----- SOCKET.IO -----//

const httpServer = createServer(app);
const io = new Server(httpServer, {});
const products = []

io.on('connection', socket => {
    console.log('New user connected');

        socket.emit('products', products);
        socket.on('update-products', data => {
            products.push(data);

            const sqlProducts = new ProductsClienteSQL(ProductsOptions);

            sqlProducts.crearTabla()
            .then(() => {
                return sqlProducts.addProducts(products)
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                return sqlProducts.close()
            })

            io.sockets.emit('products', products);
        })

        dbClass.getMsg()
        .then(d => {
            socket.emit('messages', d)
            socket.on('update-chat', async data => {
            
                dbClass.addMsgMongo(data)

                dbClass.getMsg()
                .then(data2 => {
                    io.sockets.emit('messages', data2)
                })
                .catch(err => {
                    console.log(err);
                })
            })
        })
        .catch(err => {
            console.log(err);
        })
})

//----- APP -----//

app.get('/', (req, res) => {
    res.redirect('/datos')
})

app.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/datos')
    }

    res.sendFile(__dirname + '/src/login.html')
})

app.post('/login', passport.authenticate('login', { failureRedirect: '/faillogin', successRedirect: '/datos' }))

app.get('/faillogin', (req, res) => {
    res.render('login-error')
})

app.get('/register', (req, res) => {
    if (req.user) {
        return res.redirect('/datos')
    }

    res.sendFile(__dirname + '/src/register.html')
})

app.post('/register', passport.authenticate('register', { failureRedirect: '/failregister', successRedirect: '/'}))

app.get('/failregister', (req, res) => {
    res.render('register-error')
})

app.get('/datos', requireAuthentication, (req, res) => {
    if (!req.session.contador) {
        req.session.contador = 0
    }

    req.session.contador++

    res.sendFile(__dirname + '/src/datos.html')
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    
    res.redirect('/')
})

app.get('/get-data', async (req, res) => {
    const username = req.session.passport.user;

    const user = await UserModel.findOne({'username': username}, {__v: 0, _id: 0, password: 0});

    res.send({user, contador: req.session.contador})
})

//----- LISTENING -----//

const PORT = 8080;

httpServer.listen(PORT, () => {
    console.log(`Listening in port ${PORT}`);
})