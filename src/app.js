require('dotenv').config();
const controllers = require('./controllers');

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

app.get('/download/:fileName', controllers.download);
app.post('/upload', controllers.upload);
app.use(express.static('public'));

const server = app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`));

const io = require('socket.io')(server);
io.on('connection', controllers.encode);