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

// ----- 建立 Create -----
router.post('/api/type/add', (req, res, next) => {
  let payload = {
    data: req.body.data,
  }
    
  const connection = new Connection(config); 
  const tableName = 'udnD_Type';
  const requestString = `
    if (exists(select * from ` + tableName + ` where Type_Name= N'` + payload.data + `')) begin
      select '200' as 'status', 'false' as 'successful', N'欄位已有此名稱' as 'msg'
      for json path 
    end else begin
      insert into ` + tableName + `(Type_Name)
      values(N'` + payload.data + `')
      select '200' as 'status', 'true' as 'successful', N'已加入`+ payload.data +`' as 'msg'
      for json path
    end
  `
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
          resolve(results);
          console.log('Finished');
        });
        connection.execSql(request);
      }
    });
  }).then( (results) => {
    console.log('resultsTypeTable:', results);
    res.send(JSON.parse(results));
  })
})

// ----- 讀取 Read -----
router.post('/api/type/read', (req, res) => {
  const connection = new Connection(config); 
  const tableName = 'udnD_Type';
  const requestString = `
    select * from ` + tableName + ` 
    for json auto
  `
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
          console.log('Finished');
        });
        connection.execSql(request);
      }
    });
  }).then( (results) => {
    console.log('resultsTypeTable:', results);
    res.send(JSON.parse(results));
  })
})

// ----- 更新 Update -----

// ----- 刪除 Delete -----

// ----- 測試 -----
router.get('/api/type/read', (req, res) => {
  res.send("Hello")
}) 

module.exports = router;
