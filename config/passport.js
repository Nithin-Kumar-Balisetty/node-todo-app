const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = (passport) => {
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      // Match User
      const user = await User.findOne({ email });
      if (!user) return done(null, false, { message: 'Email not registered' });

      // Match Password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Password incorrect' });

      return done(null, user);
    } catch (err) {
      console.error(err);
      done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id); // Now uses promises
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};