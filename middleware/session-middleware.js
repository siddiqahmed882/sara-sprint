import 'dotenv/config';
import session from 'express-session';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';

export function getSessionMiddleware() {
  return session({
    secret: String(process.env.SESSION_SECRET),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(), // Use existing Mongoose connection
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
    },
  });
}
