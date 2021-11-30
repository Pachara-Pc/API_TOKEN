const { date_Create, Create_Token, Create_Log, Get_List_Token, Delete_Token, Deactivate, Login_Token, Get_activity_log, Get_activity_log_specify,Get_activity_log_user } = require('./Database/Command')
var express = require('nanoexpress')
var app = express()


app.post('/create', async (req, res) => {

  const code = "2";
  const data = JSON.parse(req.body)

  const create = await Create_Token(data)
  const log = await Create_Log(data, code)
  res.send(create)


})


app.post('/get', async (req, res) => {
  const code = "A";
  const data = JSON.parse(req.body)
  const Get = await Get_List_Token(data)
  const log = await Create_Log(data, code)
  res.send(Get)


});


app.post('/del', async (req, res) => {
  const code = "3";
  const data = JSON.parse(req.body)

  const Del = await Delete_Token(data)
  const log = await Create_Log(data, code)
  res.send(Del)

});



app.post('/user_Deactivate', async (req, res) => {
  var code = "";
  const data = JSON.parse(req.body);
  if (data.deactivate == true) {
    code = "4"
  } else {
    code = "5"
  }

  if(data.admin === true){  
    const userDe = await Deactivate(data)
    const log = await Create_Log(data, code)
    res.send(userDe)
  }else{
    res.send({ "res": "you don't have permission." })
  }
  

 

});


app.post('/user_Login', async (req, res) => {
  var code = "";
  const data = JSON.parse(req.body);
  const LogIn = await Login_Token(data)

  if (LogIn.res == true) {
    code = "1"
  } else {
    code = "0"
  }
  const log = await Create_Log(data, code)
  res.send(LogIn)


});


app.post('/log', async (req, res) => {
  const code = "B";
  const data = JSON.parse(req.body);
  console.log(data);

  if (!data.end) {
    data["end"] = date_Create()

  }

  if (!data.start) {
    res.send({ "res": "requir start time to search." })
  }
  else {

    if (data.admin === true) {    //check status admin
      if (!data.code) {
        //Search All
        const actLog = await Get_activity_log(data.start, data.end,data.limit)
        const log = await Create_Log(data, code)
        res.send(actLog.data.Items)

      } else {
        //Search by code, userID and token
        //Need code & userID
        const actLog = await Get_activity_log_specify(data.code, data.userID, data.token, data.start, data.end,)
        const log = await Create_Log(data, code)
        res.send(actLog.data.Items)
      }

    } else {

      if (!data.code) {
        res.send({ "res": "you don't have permission." })
      } else {
        const actLog = await Get_activity_log_specify(data.code, data.userID, data.token, data.start, data.end)
        const log = await Create_Log(data, code)
        res.send(actLog.data.Items)
      }
    }
  }




});


app.listen(3000)