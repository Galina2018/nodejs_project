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

const upload = multer();
const port = 7380;
const logFN = path.join(__dirname, '_server.log');

// webserver.use(bodyParser.text({}));
webserver.use(bodyParser.json({}));
webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.static(path.resolve(__dirname, 'public')));

function reportServerError(error, res) {
  res.status(500).end();
  logLineAsync(logFN, `[${port}] ` + error);
}

webserver.get('/main', async (req, res) => {
  let connection = null;
  try {
    connection = await newConnectionFactory(pool, res);
    let result = await selectQueryFactory(
      connection,
      'select content from indpages',
      []
    );
    result = result.map((row) => row.content);
    let rowTable = await selectQueryFactory(
      connection,
      'select * from content_page where content=?',
      [result[0]]
    );
    rowTable = rowTable.map((row) => ({
      logo: row.logo,
      credo: row.credo,
      contact: row.contact,
      foto: row.foto,
      motivation: row.motivation,
      servoces: row.services,
      articles: row.articles,
    }));
    res.send(rowTable);
  } catch (error) {
    reportServerError(error, res);
  } finally {
    if (connection) connection.release();
  }
});

webserver.listen(port, () => console.log('webserver running on port ' + port));
