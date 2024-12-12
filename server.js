const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { logLineAsync } = require('./utils');
const {
  newConnectionFactory,
  selectQueryFactory,
  modifyQueryFactory,
  getLastInsertedId,
  getModifiedRowsCount,
} = require('./db_utils');

const poolConfig = {
  connectionLimit: 2,
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'project_db',
};
let pool = mysql.createPool(poolConfig);

const webserver = express();
webserver.set('view engine', 'ejs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public'));
  },
  filename: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString(
      'utf8'
    );
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const port = 7380;
const logFN = path.join(__dirname, '_server.log');

webserver.use(bodyParser.json({}));
webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.static(path.resolve(__dirname, 'public')));

function reportServerError(error, res) {
  res.status(500).end();
  logLineAsync(logFN, `[${port}] ` + error);
}
let dataMain;
webserver.get('/main', async (req, res) => {
  console.log('in main');
  let connection = null;
  try {
    connection = await newConnectionFactory(pool, res);
    let result = await selectQueryFactory(
      connection,
      'select content from indpages',
      []
    );
    result = result.map((row) => row.content);
    dataMain = await selectQueryFactory(
      connection,
      'select * from content_page where content=?',
      [result[0]]
    );
    dataMain = dataMain.map((row) => ({
      logo: row.logo,
      contact: row.contact,
      foto: row.foto,
      motivation: row.motivation,
      servoces: row.services,
      articles: row.articles,
    }));
    let logo = await selectQueryFactory(
      connection,
      'select url from images where code=?',
      [JSON.parse(dataMain[0].logo).image]
    );
    logo = logo.map((row) => ({
      url: row.url,
    }));
    dataMain[0].logo = logo[0].url;
    let menuMain = await selectQueryFactory(
      connection,
      'select * from lists where code=?',
      ['menu']
    );
    menuMain = menuMain.map((row) => row.name);
    dataMain[0].menu = menuMain;
    res.render('pages/main', {
      data: dataMain,
    });
  } catch (error) {
    reportServerError(error, res);
  } finally {
    if (connection) connection.release();
  }
});

webserver.get('/admin', async (req, res) => {
  console.log(123, dataMain);
  res.render('pages/admin', {
    data: dataMain,
  });
});

webserver.listen(port, () => console.log('webserver running on port ' + port));
