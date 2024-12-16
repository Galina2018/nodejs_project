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
  password: '1234',
  // password: '',
  database: 'project_db',
};
const pool = mysql.createPool(poolConfig);

const webserver = express();
webserver.set('view engine', 'ejs');
// webserver.set('view cache', false);

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

let dataMain;
let dataHeader;
let connection = null;

function reportServerError(error, res) {
  res.status(500).end();
  logLineAsync(logFN, `[${port}] ` + error);
}
async function getDataMainPage() {
  // let dataMain;
  // let connection = null;
  try {
    connection = await newConnectionFactory(pool, res);
    let result = await selectQueryFactory(
      connection,
      'select content from indpages',
      []
    );
    result = result.map((row) => row.content);

    let dataHeader = await selectQueryFactory(
      connection,
      'select * from indsection where content=?',
      [result[0]]
    );

    dataHeader = dataHeader.map((row) => ({
      image: row.image,
      list: row.list,
      text: row.text,
    }));
    let logo = await selectQueryFactory(
      connection,
      'select url from images where code=?',
      [dataHeader[0].image]
    );
    logo = logo.map((row) => ({
      url: row.url,
    }));
    dataHeader[0].image = logo[0].url;

    let menuHeader = await selectQueryFactory(
      connection,
      'select name from lists where code=?',
      [dataHeader[0].list]
    );
    menuHeader = menuHeader.map((row) => row.name);
    dataHeader[0].list = menuHeader;

    console.log('dataHeader**', dataHeader);

    let dataAbout = await selectQueryFactory(
      connection,
      'select name, text, image from group_section where content=? and code=?',
      [10, 'about']
    );
    dataAbout = dataAbout.map((row) => ({
      name: row.name,
      text: row.text,
      image: row.image,
    }));
    console.log('dataAbout**', dataAbout);

    // aboutSection = aboutSection.map((row) => ({
    //   name: row.name,
    //   text: row.text,
    //   image: row.image,
    // }));
    // dataMain[0].aboutSection = aboutSection;

    // console.log('dataMain***', dataMain)

    // let foto = await selectQueryFactory(
    //   connection,
    //   'select url from images where code=?',
    //   [dataMain[0].foto]
    // );
    // foto = foto.map((row) => ({
    //   url: row.url,
    // }));
    // dataMain[0].foto = foto[0].url;

    // let services = await selectQueryFactory(
    //   connection,
    //   'select * from lists where code=?',
    //   [dataMain[0].services]
    // );
    // services = services.map((row) => row.name);
    // dataMain[0].services = services;
    // console.log('data in func', dataMain);
    // return dataMain;
    console.log(111, dataHeader, dataAbout);
    return { dataHeader, dataAbout };
  } catch (error) {
    reportServerError(error, res);
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
});

webserver.get('/admin', async (req, res) => {
  try {
    let data = await getDataMainPage();
    // console.log('data in admin', data);
    const { dataHeader, dataAbout } = data;
    console.log('dataHeader, dataAbout in admin', dataHeader, dataAbout);
    // res.render('pages/admin', { dataHeader, dataAbout });
    res.render('pages/admin', { dataHeader, dataAbout });
  } catch (error) {
    reportServerError(error, res);
  }
});

webserver.post(
  '/saveHeaderChange',
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
          update images set url=? where code='logo'
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
          await modifyQueryFactory(
            connection,
            `
                insert into lists(code,order_name,name)
                values (?,?,?)
            ;`,
            ['menu', headerMenu.length + 1, headerMenuForAdd[i]]
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
      update indsection set text=?
      ;`,
        [req.body.headerContact]
      );
    } catch (error) {
      reportServerError(error, res);
    } finally {
      if (connection) connection.release();
    }
    res.send('ok');
  }
);

webserver.post('/deleteHeaderMenu', async (req, res) => {
  try {
    connection = await newConnectionFactory(pool, res);
    const { arrMenu, index } = req.body;
    const headerMenuName = arrMenu[index];
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

  res.send('ok');
});

webserver.post(
  '/saveAboutChange',
  upload.fields([{ name: 'aboutFoto', maxCount: 1 }]),
  async (req, res) => {
    if (req.files.aboutFoto) {
      try {
        connection = await newConnectionFactory(pool, res);
        await modifyQueryFactory(
          connection,
          `
      update images set url=? where code='foto'
  ;`,
          [req.files.aboutFoto[0].originalname]
        );
      } catch (error) {
        reportServerError(error, res);
      } finally {
        if (connection) connection.release();
      }
    }

    try {
      connection = await newConnectionFactory(pool, res);
      await modifyQueryFactory(
        connection,
        `
          update group_section set name=?, text=? where content='10' and code='about'
      ;`,
        [req.body.aboutTitle, req.body.aboutText]
      );
    } catch (error) {
      reportServerError(error, res);
    } finally {
      if (connection) connection.release();
    }
    res.send('ok');
  }
);

// webserver.post(
//   '/saveService1Change',
//   upload.fields([{ name: 'serviceImage1', maxCount: 1 }]),
//   async (req, res) => {
//     if (req.files.serviceImage1) {
//       try {
//         connection = await newConnectionFactory(pool, res);
//         await modifyQueryFactory(
//           connection,
//           `
//       update images set url=? where code='foto'
//   ;`,
//           [req.files.serviceImage1[0].originalname]
//         );
//       } catch (error) {
//         reportServerError(error, res);
//       } finally {
//         if (connection) connection.release();
//       }
//     }
//   }
// );

webserver.listen(port, () => console.log('webserver running on port ' + port));
