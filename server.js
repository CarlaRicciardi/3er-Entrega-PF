const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const MongoStore = require('connect-mongo');
const session = require('express-session');
const mongoose = require('mongoose');
const ProductoSchema = require('./models/modelProduct.js');
const compression = require('compression');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const modelUser = require('./models/modelUser.js');
const bcrypt = require('bcrypt');
const routes = require('./routes.js');

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use('/public', express.static(__dirname + '/public'));
app.use(passport.initialize()); //inicializamos passport dentro de express

const ContenedorProd = require('./classContainer/contenedor.js');
const ContenedorMsgs = require('./classContainer/contenedorMsgs.js');

const containerProd = new ContenedorProd({ name: 'products', schema: ProductoSchema });
const containerMsgs = new ContenedorMsgs('msgsTable2');

if (process.env.MODE != 'production') {
  require('dotenv').config();
}

const PORT = process.env.PORT;
const MODE = process.env.MODE;
const MONGO_URL = process.env.MONGO_URL;

function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    //este metodo lo trae passport, no esta declarada en el proyecto
    next();
  } else {
    res.redirect('/login');
  }
}
``;

//CONNECTION HANDLEBARS
const { engine } = require('express-handlebars');
app.set('view engine', 'hbs');
app.set('views', './views');
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'index.hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
  }),
);

// MONGOOSE CONNECTION
async function connectMG() {
  try {
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    console.log('Conectado a mongoDB!!!!✅');
  } catch (e) {
    console.log(e);
    throw 'can not connect to the db❌';
  }
}
connectMG();

//SESSION WITH MONGO
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      ttl: 60,
    }),
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  }),
);

//PASSPORT----------------------------------------------------------------
function isValidPassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

function createHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

passport.use(
  'login',
  new LocalStrategy((username, password, done) => {
    modelUser.findOne({ username }).then((user, err) => {
      if (err) return done(err);

      if (!user) {
        console.log('❌User Not Found with username ' + username);
        return done(null, false);
      }
      if (!isValidPassword(user, password)) {
        console.log('Invalid Password❌');
        return done(null, false);
      }
      return done(null, user);
    });
  }),
);

passport.use(
  'signup',
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      modelUser.findOne({ username: username }).then((user, err) => {
        //la busco en la db a la persona
        if (err) {
          console.log('Error in SignUp: ' + err);
          return done(err);
        }
        if (user) {
          console.log('User already exists');
          return done(null, false);
        }
        const newUser = {
          username: username,
          password: createHash(password),
          name: req.body.name,
          address: req.body.address,
          age: req.body.age,
          phone: req.body.phone,
          url: req.body.url,
        };
        modelUser.create(newUser).then((userWithId, err) => {
          if (err) {
            console.log('Error in Saving user: ' + err);
            return done(err);
          }
          console.log(user);
          console.log('User Registration succesful');
          return done(null, userWithId);
        });
      });
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser((id, done) => {
  modelUser.findById(id).then((user, err) => {
    done(err, user);
  });
});

app.use(passport.session()); //meto la sesion de passport adentro de la app (serializ y deserializ)

// FRONT END
app.get('/main', checkAuthentication, async (req, res) => {
  const products = await containerProd.getAll();
  if (products) {
    res.render('main', { products, user: req.session.user });
  }
});

//INDEX
app.get('/', routes.getRoute);

//LOGIN
app.get('/login', routes.getLogin);
app.get('/failLogin', routes.getFailLogin);
app.post('/login', passport.authenticate('login', { failureRedirect: '/failLogin' }), routes.postLogin);

//SIGNUP
app.get('/signup', routes.getSignUp);
app.get('/failSignUp', routes.getFailSignUp);
app.post('/signup', passport.authenticate('signup', { failureRedirect: '/failSignUp' }), routes.postSignUp);

//LOGOUT
app.get('/logout', routes.getLogout);

//GET INFO
app.get('/info', routes.getInfo);

app.get('/datos', (req, res) => {
  console.log(`port: ${PORT} -> Fyh: ${Date.now()}`);
  res.send(`Servidor express <span style="color:blueviolet;">(Nginx)</span> en ${PORT} - 
    <b>PID ${process.pid}</b> - ${new Date().toLocaleString()}`);
});

// app.get('/cart', routes.getCart);

//FAILROUTE
app.get('*', routes.failRoute);

//BACK END

//WEBSOCKET PARA TABLA DE PRODUCTOS
//1) conexion server
io.on('connection', async (socket) => {
  console.log('usuario conectado');
  socket.emit('msgs', await containerMsgs.getAll());
  socket.emit('products', await containerProd.getAll());

  //3) atrapamos el sendProd que hace el front cuando llena el form
  socket.on('newProd', async (data) => {
    await containerProd.save(data);
    const updateList = await containerProd.getAll();
    io.sockets.emit('products', updateList); //se la envio a todos los sockets
  });

  socket.on('newMsg', async (data) => {
    await containerMsgs.save(data);
    const msgsList = containerMsgs.getAll();
    io.sockets.emit('msgs', msgsList);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor http escuchando en el puerto http://localhost:${PORT}`);
});
