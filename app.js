require('dotenv').config();
const middlewares = require('./middlewares');
const controllers = require('./controllers');

///////////////////////////////////////// EXPRESS & MIDDLEWARES /////////////////////////////////////////
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compress());
app.use(helmet());
app.use(cors());
///////////////////////////////////////// EXPRESS & MIDDLEWARES /////////////////////////////////////////

app.get('/test/:bitRate/:inputFile', middlewares.fileExists, controllers.test);

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`));



