// возвращает соединение с БД, взятое из пула соединений
function newConnectionFactory(pool, res) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function(err, connection) {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
}

// выполняет SQL-запрос на чтение, возвращает массив прочитанных строк
function selectQueryFactory(connection, queryText, queryValues) {
  return new Promise((resolve, reject) => {
    connection.query(queryText, queryValues, function(err, rows, fields) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// выполняет SQL-запрос на чтение, возвращает одну прочитанную строку
async function selectQueryRowFactory(connection, queryText, queryValues) {
  let rows = await selectQueryFactory(connection, queryText, queryValues);
  if (rows.length !== 1) {
    throw new Error(
      'selectQueryRowFactory: single row needed, got ' +
        rows.length +
        ' rows, query: ' +
        queryText
    );
  }
  return rows[0];
}

// выполняет SQL-запрос на модификацию
function modifyQueryFactory(connection, queryText, queryValues) {
  return new Promise((resolve, reject) => {
    connection.query(queryText, queryValues, function(err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

module.exports = {
  newConnectionFactory,
  selectQueryFactory,
  selectQueryRowFactory,
  modifyQueryFactory,
};
