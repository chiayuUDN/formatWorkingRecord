'use strict'
const tedious = require('tedious');
const Connection = tedious.Connection;
const Request = tedious.Request;


var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const config = {
  server:'10.9.50.51',
  authentication: {
    type: 'default',
    options: {
        userName: 'SA',
        password: 'udnD36091011'
    }
  },
  options: {
    database: 'udnD'
  }
};

function querySQL(requestString, res){
  console.log('----- begin -----');
  const connection = new Connection(config); 
  let results = [];
  new Promise((resolve, reject) => {
    connection.on('connect', function(err) {  
      // If no error, then good to proceed.
      if(err) {
        console.log('Error: ', err)
      } else {
        console.log("SQL Server Connected!");
        const request = new Request(requestString, (err) => {
          if(err) {
            console.log('Query error: ', err)
          } else {
            console.log('Query start')
          }
        });
      
        request.on('row', function(rowData){
          rowData.forEach(function(data){
            if (data.value === null){
              console.log('NULL');
            } else {
              results = data.value;
            }
          })
        });
      
        request.on('requestCompleted', function(){
          resolve(results)
          console.log('results:', results);
          console.log('Finished');
        });
        connection.execSql(request);
      }
    });
  }).then( (results) => {
    res.send(JSON.parse(results));
  })
}
// ----- 建立 Create -----
router.post('/api/add/type', (req, res, next) => {
  let payload = {
    Name: req.body.Name,
  }
    
  const tableName = 'udnD_Type';
  const requestString = `
    if (exists(select * from ` + tableName + ` where Type_Name= N'` + payload.Name + `')) begin
      select 'false' as 'successful', N'欄位已有此名稱' as 'msg'
      for json path 
    end else begin
      insert into ` + tableName + `(Type_Name)
      values(N'` + payload.Name + `')
      select 'true' as 'successful', N'已加入: `+ payload.Name +`' as 'msg'
      for json path
    end
  `
  querySQL(requestString, res)
})

// ----- 讀取 Read -----

router.post('/api/read/type', (req, res) => {
  const tableName = 'udnD_Type';
  const requestString = `
    select * from ` + tableName + ` 
    for json auto
  `
  querySQL(requestString, res);
})

router.post('/api/read/project', (req, res) => {
  const tableName = 'udnD_Project';
  let payload = {
    FID: req.body.FID,
  }
  const requestString = `
    select * from ` + tableName + `  where Type_ID = ` + payload.FID + `
    for json path
  `
  querySQL(requestString, res);
})

router.post('/api/read/item', (req, res) => {
  const tableName = 'udnD_Item';
  let payload = {
    FID: req.body.FID,
  }
  const requestString = `
    select * from ` + tableName + `  where Project_ID = ` + payload.FID + `
    for json path
  `
  querySQL(requestString, res);
})

router.post('/api/read/employee', (req,res) => {
  const tableName = 'udnD_Employee';
  const requestString = `
    select * from ` + tableName + ` 
    for json auto
  `
  querySQL(requestString, res);
})

// ----- 更新 Update -----
router.put('/api/update/type', (req, res) => {
  console.log('----- begin -----');
  let payload = {
    ID: req.body.ID,
    Name: req.body.Name,
  }

  const tableName = 'udnD_Type';
  const requestString = `
    if(exists(select * from ` + tableName + ` where Type_ID=` + payload.ID + `)) begin
      update ` + tableName + `
      set Type_Name = N'` + payload.Name + `'
      where Type_ID = ` + payload.ID + `
      select 'true' as 'successful', N'已更新: `+ payload.Name +`' as 'msg'
      for json path
    end else begin
      select 'false' as 'successful', N'沒有此ID' as 'msg'
      for json path
    end
  `
  querySQL(requestString, res);
})


// ----- 刪除 Delete -----
router.delete('/api/delete/type', (req, res) => {
  res.send('Doing delete')
})

module.exports = router;
