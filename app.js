const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const exphbs = require('express-handlebars')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// view engine setup
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'index'
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// console.log(process.env.NODE_ENV)

const mongoose = require("mongoose");
const router = require('./routes/users');
mongoose.set('strictQuery', false);

//mongo atlas proj: snowboard-inventory
const dev_db_url =
  `mongodb+srv://admin:${process.env.MONGO_PASSWORD}@cluster0.a9hakyv.mongodb.net/Inventory?retryWrites=true&w=majority`;
const mongoDB = process.env.MONGODB_URI || dev_db_url;

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

var hbs = exphbs.create({});

//helper functions
hbs.handlebars.registerHelper('inc', function(number) {
    if(typeof(number) === 'undefined' || number === null)
        return null;
    // Increment by inc parameter if it exists or just by one
    return number + 1;
})

hbs.handlebars.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});

hbs.handlebars.registerHelper('ifnoteq', function (a, b, options) {
  if (Number(a) != Number(b)) { return options.fn(this); }
  return options.inverse(this);
});

hbs.handlebars.registerHelper('iflessthan', function (a, b, options) {
  // console.log(a, b)
  if (a < (b-1) ) { return options.fn(this); }
  return options.inverse(this);
});

hbs.handlebars.registerHelper('assign', function (varName, varValue, options) {
  if (!options.data.root) {
      options.data.root = {};
  }
  options.data.root[varName] = varValue;
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('error handler in app.js')
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log(err)
  console.log(req)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
