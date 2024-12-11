const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const mysql = require('mysql');

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

webserver.use(bodyParser.text({}));
webserver.use(bodyParser.json({}));
webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.static(path.resolve(__dirname, 'public')));

webserver.get('/main', (req, res) => {
  pool.getConnection((err, connection) => {
    try {
      connection.query('select content from indpages', (error, results) => {
        if (error) {
          res.status(500).send(error);
        } else {
          // results = results.map((row) => ({
          //   content: row.content,
          // }));
          console.log('results', results);
          results = results.map((row) => row.content);
          console.log('results', results);
          res.send(results);
        }
      });
    } catch (err) {
      res.status(500).end();
    } finally {
      if (connection) connection.release();
    }
  });
});

webserver.listen(port, () => console.log('webserver running on port ' + port));
