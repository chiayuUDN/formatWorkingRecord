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
const addData01 = {
  add: ['employee','type'],
  table: ['udnD_Employee','udnD_Type'],
  fieldName: ['Employee_Name', 'Type_Name']
}

for(let i = 0; i < addData01.add.length; i++){
  router.post('/api/add/' + addData01.add[i] , (req, res) => {
    const table = addData01.table[i]
    const fieldName = addData01.fieldName[i]
    let payload = {
      Name: req.body.Name,
    }
    const requestString = `
      declare @Name nvarchar(50) = N'` + payload.Name + `'
      declare @IsEnable int
      select @IsEnable = isEnable from ` + table + ` where ` + fieldName + ` = @Name
      if(@IsEnable = 1) begin
        /* 已有資料  */
        select N'欄位已有此名稱' as 'msg'
        for json path
      end else begin
        if(@IsEnable is null) begin
          /* INSERT */
          insert into ` + table + `(` + fieldName + `)
          values(@Name)
        end else begin
          /* UPDATE  */
          update ` + table + `
          set isEnable = 1
          where ` + fieldName + ` = @Name
        end
        select N'已加入:'+@Name+'' as 'msg'
        for json path
      end
    `
  
    querySQL(requestString, res)
  })
}

const addData02 = {
  add: ['project','item'],
  table : ['udnD_Project','udnD_Item'],
  fieldName: ['Project_Name', 'Item_Name'],
  fieldID : ['Type_ID', 'Project_ID'],
}
for(let i = 0; i < addData02.add.length; i++){
  router.post('/api/add/' + addData02.add[i], (req, res) => {
    const table = addData02.table[i]
    const fieldName = addData02.fieldName[i]
    const fieldID = addData02.fieldID[i]
    let payload = {
      FK_ID: req.body.FK_ID,
      Name: req.body.Name,
    }
    const requestString = `
      declare @Name nvarchar(50) = N'` + payload.Name + `'
      declare @IsEnable int
      declare @ID int = ` + payload.FK_ID + `
      select @IsEnable = isEnable 
      from ` + table + ` 
      where ` + fieldName + ` = @Name AND `+ fieldID +`= @ID
      if(@IsEnable = 1) begin
        /* 已有資料  */
        select N'欄位已有此名稱' as 'msg'
        for json path
      end else begin
        if(@IsEnable is null) begin
          /* INSERT */
          insert into ` + table + `(` + fieldName + `, `+ fieldID +` )
          values(@Name, @ID)
        end else begin
          /* UPDATE  */
          update ` + table + `
          set isEnable = 1
          where ` + fieldName + ` = @Name
        end
        select N'已加入:'+@Name+'' as 'msg'
        for json path
      end
    `
  
    querySQL(requestString, res)
  })
}

// ----- 讀取 Read -----
const readData01 = {
  read : ['employee','type'],
  table : ['udnD_Employee','udnD_Type']
}

for(let i = 0; i < readData01.read.length; i++){
  router.post('/api/read/' + readData01.read[i], (req,res) => {
    const requestString = `
      select * from ` + readData01.table[i] + ` 
      for json path
    `
    querySQL(requestString, res);
  })
}

const readData02 = {
  read : ['project','item'],
  table : ['udnD_Project','udnD_Item'],
  fieldID : ['Type_ID', 'Project_ID'],
}

for(let i = 0; i < readData02.read.length; i++){
  router.post('/api/read/' + readData02.read[i], (req, res) => {
    const table = readData02.table[i];
    const fieldID = readData02.fieldID[i]
    let payload = {
      FK_ID: req.body.FK_ID,
    }
    const requestString = `
      declare @ID int = ` + payload.FK_ID + `
      if(exists(select * from ` + table + ` where ` + fieldID + ` = @ID)) begin
        select * from ` + table + ` where ` + fieldID + ` = @ID
          for json path
      end else begin 
        select N'無資料' as 'msg'
          for json path
      end
    `
    querySQL(requestString, res);
  })
}

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
const deletData01 = {
  delete : ['employee', 'type', 'project', 'item'],
  table : ['udnD_Employee', 'udnD_Type', 'udnD_Project', 'udnD_Item'],
  fieldName: ['Employee_Name', 'Type_Name', 'Project_Name', 'Item_Name']
}
for(let i = 0; i < deletData01.delete.length; i++){
  router.post('/api/delete/' + deletData01.delete[i], (req, res) => {
    const table = deletData01.table[i];
    const fieldName = deletData01.fieldName[i]
    let payload = {
      Name: req.body.Name,
    }
    const requestString = `
    update ` + table + ` 
    set isEnable = 0
    where ` + fieldName + ` = N'` + payload.Name + `'
    select 'true' as 'successful', N'已刪除:` + payload.Name + `' as 'msg'
    for json path
    `
    querySQL(requestString, res);
  })
}

// router.post('/api/delete/project', (req, res) => {
//   let payload = {
//     Name: req.body.Name,
//   }
//   const tableName = 'udnD_Project';
//   const requestString = `
//   update ` + tableName + ` 
//   set isEnable = 0
//   where Project_Name = N'` + payload.Name + `'
//   select 'true' as 'successful', N'已刪除:` + payload.Name + `' as 'msg'
//   for json path
//   `
//   querySQL(requestString, res);
// })

// router.post('/api/delete/item', (req, res) => {
//   let payload = {
//     Name: req.body.Name,
//   }
//   const tableName = 'udnD_Item';
//   const requestString = `
//   update ` + tableName + ` 
//   set isEnable = 0
//   where Item_Name = N'` + payload.Name + `'
//   select 'true' as 'successful', N'已刪除:` + payload.Name + `' as 'msg'
//   for json path
//   `
//   querySQL(requestString, res);
// })

module.exports = router;
