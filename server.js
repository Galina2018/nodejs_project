const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { logLineAsync } = require('./utils');
const { verifyUser } = require('./funcHash');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const res = require('express/lib/response');

const secret = 'thisshouldbeasecret';

const {
  newConnectionFactory,
  selectQueryFactory,
  selectQueryRowFactory,
  modifyQueryFactory,
  getLastInsertedId,
  getModifiedRowsCount,
} = require('./db_utils');

const poolConfig = {
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '1234',
  // password: '',
  database: 'project_db',
};
const pool = mysql.createPool(poolConfig);

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
const port = 7381;
const logFN = path.join(__dirname, '_server.log');

webserver.use(bodyParser.text({}));
webserver.use(bodyParser.json({}));
webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.static(path.resolve(__dirname, 'public')));
webserver.use(
  '/tinymce',
  express.static(path.join(__dirname, 'node_modules', 'tinymce'))
);
webserver.use(cookieParser());

let connection = null;

function reportServerError(error, res) {
  res.status(500).end();
  logLineAsync(logFN, `[${port}] ` + error);
}

function verifyAuthToken(req, res, next) {
  console.log('in verifyAuthToken');
  const { token } = req.cookies;
  jwt.verify(token, secret, function(err, decoded) {
    if (err) {
      return (
        res
          .status(401)
          // .send('Authentication failed! Please try again :(')
          .redirect('/login')
      );
    }
    req.userId = decoded.id;
    next();
  });
}

async function getDataMainPage() {
  try {
    connection = await newConnectionFactory(pool, res);
    let result = await selectQueryFactory(
      connection,
      'select content from pages',
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

    let foto = await selectQueryFactory(
      connection,
      'select url from images where code=?',
      [dataAbout[0].image]
    );
    foto = foto.map((row) => ({
      url: row.url,
    }));
    dataAbout[0].image = foto[0].url;

    let dataServices = await selectQueryFactory(
      connection,
      `select name, text, image from group_section where content=10 and code='services'`,
      []
    );
    dataServices = dataServices.map((row) => ({
      name: row.name,
      text: row.text,
      image: row.image,
    }));
    let images = await selectQueryFactory(
      connection,
      `select code, url from images `,
      []
    );
    images = images.map((row) => ({
      code: row.code,
      url: row.url,
    }));

    dataServices = dataServices.map((e) => {
      const el = images.find((img) => img.code === e.image);
      if (el) {
        e.image = el.url;
      } else e.image = '';
      return e;
    });
    let dataArticles = await selectQueryFactory(
      connection,
      `select name, text, image from group_section where content=10 and code='articles' order by code_order`,
      []
    );
    dataArticles = dataArticles.map((row) => ({
      name: row.name,
      text: row.text,
      image: row.image,
    }));
    dataArticles = dataArticles.map((e) => {
      const el = images.find((img) => img.code === e.image);
      if (el) {
        e.image = el.url;
      } else e.image = '';
      return e;
    });
    let dataSeo = await selectQueryFactory(
      connection,
      `select url_code, content, title, metakeywords, metadescription from pages`,
      []
    );
    dataSeo = dataSeo.map((row) => ({
      url: row.url_code,
      content: row.content,
      title: row.title,
      metakeywords: row.metakeywords,
      metadescription: row.metadescription,
    }));
    return { dataHeader, dataAbout, dataServices, dataArticles, dataSeo };
  } catch (error) {
    reportServerError(error, res);
  } finally {
    if (connection) connection.release();
  }
}

// async function saveUser({ login, password }) {
//   console.log('login, password', login, password);
//   try {
//     connection = await newConnectionFactory(pool, res);
//     await modifyQueryFactory(
//       connection,
//       `
//           insert into users(login, password)
//           values (?,?)
//       ;`,
//       [login, password]
//     );
//   } catch (error) {
//     reportServerError(error, res);
//   } finally {
//     if (connection) connection.release();
//   }
// }
async function getUser(login) {
  try {
    connection = await newConnectionFactory(pool, res);
    const user = await selectQueryFactory(
      connection,
      `
          select login, password from users where login=?
         
      ;`,
      [login]
    );
    return user;
  } catch (error) {
    reportServerError(error, res);
  } finally {
    if (connection) connection.release();
  }
}

async function verificationUser(login, password) {
  let storedUser = await getUser(login);
  storedUser = storedUser.map((row) => ({
    login: row.login,
    password: row.password,
  }));
  if (storedUser.length) {
    const verify = await verifyUser(
      login,
      storedUser[0].login,
      password,
      storedUser[0].password
    );
    return verify;
  } else return false;
}

webserver.get('/', async (req, res) => {
  try {
    let data = await getDataMainPage();
    const { dataHeader, dataAbout, dataServices, dataArticles, dataSeo } = data;
    res.render('pages/main', {
      dataHeader,
      dataAbout,
      dataServices,
      dataArticles,
      dataSeo,
    });
  } catch (error) {
    reportServerError(error, res);
  }
});

webserver.get('/admin', verifyAuthToken, async (req, res) => {
  try {
    console.log('in /admin');
    let data = await getDataMainPage();
    const { dataHeader, dataAbout, dataServices, dataArticles, dataSeo } = data;
    res.render('pages/admin', {
      dataHeader,
      dataAbout,
      dataServices,
      dataArticles,
      dataSeo,
    });
  } catch (error) {
    reportServerError(error, res);
  }
});

webserver.get('/about', async (req, res) => {
  try {
    let data = await getDataMainPage();
    const { dataHeader, dataAbout } = data;
    res.render('pages/about', {
      dataHeader,
      dataAbout,
    });
  } catch (error) {
    reportServerError(error, res);
  }
});

webserver.get('/login', (req, res) => {
  console.log('in get');
  try {
    res.render('pages/login');
  } catch (error) {
    reportServerError(error, res);
  }
});

webserver.post('/login', upload.none(), async (req, res) => {
  try {
    console.log('in post login', req.body);
    const isVerify = await verificationUser(
      req.body.username,
      req.body.password
    );
    if (isVerify) {
      connection = await newConnectionFactory(pool, res);
      let userId = await selectQueryRowFactory(
        connection,
        'select id from users where login=?',
        [req.body.username]
      );
      const token = jwt.sign({ id: userId.id }, secret, {
        expiresIn: 86400,
        // expiresIn: 10,
      });
      await modifyQueryFactory(
        connection,
        `
        insert into sessions(login, date, token)
        values (?,?,?)
        ;`,
        [req.body.username, new Date(), token]
      );
      res.cookie('token', token);
      res.status(200).send('Successfully logged-in!');
    } else {
      res.status(401).send('Verification failed.');
    }
  } catch (error) {
    reportServerError(error, res);
  }
});

webserver.post(
  '/saveHeaderChange',
  upload.fields([{ name: 'headerLogo', maxCount: 1 }]),
  verifyAuthToken,
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

    try {
      connection = await newConnectionFactory(pool, res);

      if (req.files.headerLogo) {
        await modifyQueryFactory(
          connection,
          `
          update images set url=? where code='logo'
      ;`,
          [req.files.headerLogo[0].originalname]
        );
      }

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

      if (headerMenuForAdd.length > 0) {
        let idx = headerMenu.length + 1;
        let i = 0;
        while (i < headerMenuForAdd.length) {
          await modifyQueryFactory(
            connection,
            `
                insert into lists(code,order_name,name)
                values (?,?,?)
            ;`,
            ['menu', idx, headerMenuForAdd[i]]
          );
          i++;
          idx++;
        }
      }

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
    try {
      connection = await newConnectionFactory(pool, res);
      if (req.files.aboutFoto) {
        await modifyQueryFactory(
          connection,
          `
      update images set url=? where code='foto'
  ;`,
          [req.files.aboutFoto[0].originalname]
        );
      }
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

webserver.post(
  '/saveServiceChange/:serviceNumber',
  upload.fields([{ name: `serviceImage`, maxCount: 1 }]),
  async (req, res) => {
    try {
      connection = await newConnectionFactory(pool, res);
      let imageCode = await selectQueryRowFactory(
        connection,
        `
            select image from group_section where content='10' and code='services' and code_order=?
        ;`,
        [req.params.serviceNumber]
      );
      imageCode = imageCode.image;
      if (req.files.serviceImage) {
        await modifyQueryFactory(
          connection,
          `
      update images set url=? where code=?
  ;`,
          [req.files.serviceImage[0].originalname, imageCode]
        );
      }
      await modifyQueryFactory(
        connection,
        `
            update group_section set name=?, text=? where content='10' and code='services' and code_order=?
        ;`,
        [req.body.serviceTitle, req.body.serviceText, req.params.serviceNumber]
      );
    } catch (error) {
      reportServerError(error, res);
    } finally {
      if (connection) connection.release();
    }
    res.send('ok');
  }
);

webserver.post(
  '/saveArticlesChange/:articleNumber',
  upload.fields([{ name: `articleImage`, maxCount: 1 }]),
  async (req, res) => {
    try {
      connection = await newConnectionFactory(pool, res);
      await modifyQueryFactory(
        connection,
        `
            update group_section set name=?, text=? where content='10' and code='articles' and code_order=?
        ;`,
        [req.body.articleTitle, req.body.articleText, req.params.articleNumber]
      );
      let imageCode = await selectQueryRowFactory(
        connection,
        `
        select image from group_section where content='10' and code='articles' and code_order=?
        ;`,
        [req.params.articleNumber]
      );
      imageCode = imageCode.image;
      if (req.files.articleImage) {
        await modifyQueryFactory(
          connection,
          `
      update images set url=? where code=?
  ;`,
          [req.files.articleImage[0].originalname, imageCode]
        );
      }
    } catch (error) {
      reportServerError(error, res);
    } finally {
      if (connection) connection.release();
    }
    res.send('ok');
  }
);

webserver.post('/saveSeoChange', upload.none(), async (req, res) => {
  const body = req.body;
  let keys = Object.keys(body);
  keys = keys.map((e) => e.slice(-1));
  keys = [...new Set(keys)];

  let entries = Object.entries(body);
  const dataSeo = keys.map((e) => {
    let arr = [];
    let rgxp = new RegExp(e);
    entries.forEach(([k, val]) => {
      if (k.match(rgxp)) {
        arr.push([k.slice(0, -1), val]);
      }
    });
    arr.unshift(['content', (+e + 1) * 10]);
    return Object.fromEntries(arr);
  });

  try {
    connection = await newConnectionFactory(pool, res);

    dataSeo.forEach(async (e) => {
      await modifyQueryFactory(
        connection,
        `
              update pages set title=?, metakeywords=?, metadescription=? where content=?
          ;`,
        [e.seoTitle, e.seoMetakeywords, e.seoMetadescription, e.content]
      );
    });
  } catch (error) {
    reportServerError(error, res);
  } finally {
    if (connection) connection.release();
  }
  res.send('ok');
});

webserver.listen(port, () => console.log('webserver running on port ' + port));
