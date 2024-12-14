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
const res = require('express/lib/response');

const poolConfig = {
  connectionLimit: 2,
  host: 'localhost',
  user: 'root',
  // password: '1234',
  password: '',
  database: 'project_db',
};
// let pool = mysql.createPool(poolConfig);
const pool = mysql.createPool(poolConfig);

const webserver = express();
webserver.set('view engine', 'ejs');
webserver.set('view cache', false);

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

webserver.use(bodyParser.text({}));
webserver.use(bodyParser.json({}));
webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.static(path.resolve(__dirname, 'public')));

function reportServerError(error) {
  // res.status(500).end();
  logLineAsync(logFN, `[${port}] ` + error);
}
async function getDataMainPage() {
  let dataMain;
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
      services: row.services,
      articles: row.articles,
    }));
    let logo = await selectQueryFactory(
      connection,
      'select url from images where code=?',
      ['logo']
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
    // console.log('data in func', dataMain);
    return dataMain;
  } catch (error) {
    reportServerError(error);
  } finally {
    if (connection) connection.release();
  }
}

webserver.get('/main', async (req, res) => {
  let data;
  try {
    data = await getDataMainPage();
    res.render('pages/main', { data });
  } catch (error) {
    reportServerError(error, res);
  }
  // console.log('data in main', data);
});

webserver.get('/admin', async (req, res) => {
  let data;
  try {
    console.log('in /admin****');
    data = await getDataMainPage();
    console.log('data in admin', data);
    res.render('pages/admin', { data });
  } catch (error) {
    reportServerError(error, res);
  }
});

webserver.post(
  '/addHeaderChange',
  upload.fields([{ name: 'headerLogo', maxCount: 1 }]),
  async (req, res) => {
    let headerMenu = Object.keys(req.body)
      .map((e) => {
        if (e.match(/headerMenu\d{1}/)) return req.body[e];
      })
      .filter((e) => !!e);
    let headerMenuForAdd = Object.keys(req.body)
      .map((e) => {
        if (e.match(/headerMenu$/)) return req.body[e];
      })
      .filter((e) => !!e)
      .flat();
    if (req.files.headerLogo) {
      try {
        connection = await newConnectionFactory(pool, res);
        await modifyQueryFactory(
          connection,
          `
          update images set url=?
      ;`,
          [req.files.headerLogo[0].originalname]
        );
      } catch (error) {
        reportServerError(error, res);
      } finally {
        if (connection) connection.release();
      }
    }

    try {
      connection = await newConnectionFactory(pool, res);
      for (let i = 0; i < headerMenu.length; i++) {
        console.log('headerMenu[i], i + 1', headerMenu[i], i + 1);
        await modifyQueryFactory(
          connection,
          `
                update lists set name=?
                where code='menu' and order_name=?
            ;`,
          [headerMenu[i], i + 1]
        );
      }
    } catch (error) {
      reportServerError(error, res);
    } finally {
      if (connection) connection.release();
    }

    try {
      connection = await newConnectionFactory(pool, res);
      if (headerMenuForAdd.length > 0) {
        let i = 0;
        while (i < headerMenuForAdd.length) {
          console.log(60, i);
          await modifyQueryFactory(
            connection,
            `
                insert into lists(code,order_name,name)
                values (?,?,?)
            ;`,
            ['menu', headerMenu.length+1, headerMenuForAdd[i]]
          );
          i++;
        }
      }
    } catch (error) {
      reportServerError(error, res);
    } finally {
      if (connection) connection.release();
    }

    try {
      connection = await newConnectionFactory(pool, res);
      await modifyQueryFactory(
        connection,
        `
      update content_page set contact=?
      ;`,
        [req.body.headerContact]
      );
    } catch (error) {
      reportServerError(error, res);
    } finally {
      if (connection) connection.release();
    }

    // try {
    //   connection = await newConnectionFactory(pool, res);
    //   const data = await getDataMainPage();
    //   res.render('pages/admin', { data });
    // } catch (error) {
    //   reportServerError(error, res);
    // } finally {
    //   if (connection) connection.release();
    // }
    res.send('ok')
  }
);

webserver.post('/deleteHeaderMenu', async (req, res) => {
  try {
    connection = await newConnectionFactory(pool, res);
    const { arrMenu, index } = req.body;
    const headerMenuName = arrMenu[index];
    console.log('headerMenuName', headerMenuName);
    await modifyQueryFactory(
      connection,
      `
      delete from lists where name=? limit 1
      ;`,
      [headerMenuName]
    );
  } catch (error) {
    reportServerError(error, res);
  } finally {
    if (connection) connection.release();
  }

  res.end();
});

webserver.listen(port, () => console.log('webserver running on port ' + port));
