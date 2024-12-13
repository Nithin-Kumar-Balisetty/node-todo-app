const express = require('express')
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

const app = express()

const port = 3000
app.use(express.static(__dirname + '/public'));

require('./config/passport')(passport);
require('dotenv').config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));



// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global Variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Set View Engine
app.set('view engine', 'ejs');



app.get('/', (req, res) => {
  if(req.isAuthenticated()) res.redirect('/dashboard');
  else res.sendFile(__dirname+'/public/login.html');
})

app.listen(port, '0.0.0.0' ,() => console.log(`Listening on port ${port}!`))


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: 'No user exists. Please register an account.' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.json({ message: 'Incorrect password. Please try again.' });
      }
      req.login(user, (err) => {
        if (err) {
          console.error(err);
          return next(err);
        }
        return res.json({ message: 'Login successful!' });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  });


  app.post('/register', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (user) {
        return res.json({ message: 'User already exists. Please log in.' });
      }
      console.log(email,password);
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
  
      await newUser.save();
      return res.json({ message: 'Registration successful! You can now log in.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  });


app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  else res.render('dashboard', { user: req.user });
});

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

const todoRoutes = require('./routes/todoRoutes');
app.use('/todos', todoRoutes);