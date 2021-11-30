
const { ConnectDB } = require("./connect")
const randtoken = require('rand-token')
const CRC32 = require('crc-32');
const Log_table = "api_logging"
const Token_table = "api_token"
const pinolog = require('pino')()

// Hash CRC32 token + user
function hasing(token) {
  // console.log(token + user);
  let crc32 = CRC32.str(token)
  return `${crc32}`
}

// Create current date
function date_Create() {
  const time = new Date()
  return new Date(`${time.getFullYear()} ${time.getUTCMonth() + 1} ${time.getUTCDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()} UTC`).toISOString()
}

// Create expired date  1 exp = 1 day
function date_expired(exp) {
  const time = new Date()
  return Math.floor(time.getTime() / 1000) + (60 * 60 * 24 * exp)
}

// Create token random 
function Create_Token(Data) {

  var Log_Data = {}
  var token = randtoken.generate(10)
  var time = date_Create()


  if (Data.expiredate) {
    var exp = date_expired(Data.expiredate)
    Log_Data['exp'] = parseInt(exp)
  }

  Log_Data['userID'] = Data.userID
  Log_Data['name'] = Data.tokenName
  Log_Data['userDeactivate'] = false
  Log_Data['create'] = time
  Log_Data['detail'] = Data.detail
  Log_Data['expiredate'] = Data.expiredate
  var params = {
    TableName: Token_table,
    Item: Log_Data

  };

  return new Promise(res => {

    let temp = Data.tokenName
    let token_hash = hasing(token)

    params.Item['tokenhash'] = token_hash

    // Create token and save to database 
    ConnectDB.put(params, function (err, data) {
      if (err) {

        pinolog.info({
          "function": "Create_Token",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })
      } else {

        pinolog.info({
          "function": "Create_Token",
          "detail": params,
          "res": true,
          "token": {
            "username": params.Item.userID,
            "password": token,  //token password
            "expire": params.Item.expiredate
          }

        })

        res({
          "res": true,
          "token": {
            "username": params.Item.userID,
            "password": token,  //token password
            "expire": params.Item.expiredate
          }

        })
      }

    });
  })

}

// Create data in log table
function Create_Log(Data, code) {

  var Log_Data = {}
  var time = date_Create()

  if (code === "2") {    // Create token

    var exp = date_expired(200)   // set time expired log.  200 day
    Log_Data['code'] = `${code}\t`
    Log_Data['uID'] = `${Data.userID}\t`
    Log_Data['dt'] = time
    Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.acc }
    Log_Data['ip'] = Data.ip
    Log_Data['UA'] = Data.acc
    Log_Data['tokenName'] = Data.tokenName
    Log_Data['TTL'] = parseInt(exp)

  } else {
    var exp = date_expired(200) // set time expired log.  200 day
    Log_Data['TTL'] = parseInt(exp)
    Log_Data['dt'] = time
    Log_Data['ip'] = Data.ip
    Log_Data['UA'] = Data.acc

    //name expiredate
    if (code === "0") {          // Login Fail: No UserID/token
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "token": Data.token }
    } else if (code === "1") {    // Login Pass
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "token": Data.token, "Deactivate": Data.deactivate }
    }
    else if (code === "3") {    // Delete token
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.acc }
    }
    else if (code === "4") {    // Deactivate user ID
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.name }
    }
    else if (code === "5") {    // Activate user ID
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.name }
    }
    else if (code === "A" && Data.admin === true) {       // get list of token (of all users) by Admin
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.acc }
    }
    else if (code === "A" && Data.admin === false) {     // get list of token (of user ID)
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.acc }
    }
    else if (code === "B" && Data.admin === true) {      // Read log (of all users) by Admin
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.acc, "dt-min": Data.start, "dt-max": Data.end }
    }
    else if (code === "B" && Data.admin === false) {     // Read log (of user ID)
      Log_Data['code'] = `${code}\t`
      Log_Data['uID'] = `${Data.userID}\t`
      Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.acc, "dt-min": Data.start, "dt-max": Data.end }
    }
    // else if(uID === "B" && Data.admin === false){
    //   Log_Data['uID'] = `${uID}\t${Data.userID}\t${Data.tokenName}`
    //   Log_Data['msg'] = { "admin": Data.admin, "AccID": Data.acc, "dt-min": Data.start, "dt-max": Data.end }
    // }
  }


  return new Promise(res => {
    // console.log(Log_Data);
    var params = {
      TableName: Log_table,
      Item: Log_Data
    };
    ConnectDB.put(params, function (err, data) {


      if (err) {

        pinolog.info({
          "function": "Create_Log",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })
      } else {

        pinolog.info({
          "function": "Create_Log",
          "detail": params,
          "res": true,
        })

        res({
          "res": true,

        })
      }

    });
  })
}

// get token search by userID
function Get_List_Token(Data, uID) {
  var time = date_Create()

  if (Data.userID) {
    params = {
      TableName: Token_table,
      FilterExpression: 'userID = :id',
      ExpressionAttributeValues: { ':id': Data.userID }
    }
  } else {

    params = {
      TableName: Token_table
    }

  }


  return new Promise(res => {

    ConnectDB.scan(params, function (err, data) {

      if (err) {

        pinolog.info({
          "function": "Get_List_Token",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })

      } else {


        if (!Data.userID && Data.admin === false) {    // no permission

          pinolog.info({
            "function": "Get_List_Token",
            "detail": params,
            "res": "your don't have permission."
          })


          res({ "res": "your don't have permission." })

        } else {
          if (data.Items.length === 0) {

            pinolog.info({
              "function": "Get_List_Token",
              "detail": params,
              "res": "not found."
            })

            res({ "res": "not found." })               // not found maybe userID don't have token or don't have userID
          } else {

            pinolog.info({
              "function": "Get_List_Token",
              "detail": params,
              "res": "found token."
            })

            res(data.Items)                         // return token
          }
        }



      }
    });
  })

}

// Delete token
function Delete_Token(Data) {

  var params = {
    TableName: Token_table,
    Key: {
      "userID": Data.userID,
      "name": Data.name
    }
  };

  return new Promise(res => {

    ConnectDB.delete(params, function (err, data) {

      if (err) {

        pinolog.info({
          "function": "Delete_Token",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })

      } else {
        pinolog.info({
          "function": "Delete_Token",
          "detail": params,
          "res": true,
          "msg": "delete succeeded:"
        })

        res({
          "res": true,
          "msg": "delete succeeded:"
        })
      }
    });
  })

}


// change status Deactivate 
function Deactivate(Data) {

  console.log(Data);
  var params = {
    TableName: Token_table,
    Key: {
      "userID": Data.userID,
      "name": Data.name
    },
    UpdateExpression: "set userDeactivate= :a",
    ExpressionAttributeValues: {
      ':a': Data.deactivate
    },


  };
  return new Promise(res => {
    ConnectDB.update(params, function (err, data) {


      if (err) {
        
        pinolog.info({
          "function": "Deactivate",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })

      } else {

        pinolog.info({
          "function": "Deactivate",
          "detail": params,
          "res": "Deactivate update"
        })

        res({
          "res": "Deactivate update"

        })
      }

    });
  })

}

// Search token in database
function Login_Token(Data) {
  const token_hash = hasing(Data.token)
  // console.log(Data.token);
  // console.log(token_hash);
  var params = {
    TableName: Token_table,
    KeyConditionExpression: " #userID = :value_1 ",
    FilterExpression: "contains(tokenhash,:value_2)",
    ExpressionAttributeNames: {
      "#userID": "userID",
    
    },
    ExpressionAttributeValues: {
      ":value_1": Data.userID,
      ":value_2": token_hash
    }
  }

  return new Promise(res => {
    ConnectDB.query(params, function (err, data) {


      if (err) {

        pinolog.info({
          "function": "Login_Token",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })
      } else {

        if(data.Items.length === 0){
          pinolog.info({
            "function": "Login_Token",
            "res": false,
            "msg": `userID or token incorrect. `
          })
    
          res({
            "res": false,
            "msg": `userID or token incorrect. `
          })
        }else{
            const {userDeactivate} = data.Items[0]
            // console.log(data.Items[0]);
            if(userDeactivate === true){

              pinolog.info({
                "function": "Login_Token",
                "res": false,
                "msg": `This token is deactivate. `
              })
        
              res({
                "res": false,
                "msg": `This token is deactivate. `
              })
            
            }else{

              pinolog.info({
                "function": "Login_Token",
                "res": true,
                "msg": `Login Success.  `
              })
        
              res({
                "res": true,
                "msg": `Login Success.  `
              })

            }
        }

       
      }




    });
  })
}



// search  activity log in database
function Get_activity_log_specify(code,ID,token, start, end) {
  
  var params = {
    TableName: Log_table,
    KeyConditionExpression: "#code =:code and #dt between :start and :stop  ",
    ExpressionAttributeNames: {
      "#dt": "dt",
      "#code": "code",
    },
    ExpressionAttributeValues: {
      // ":token":token,
      // ":userID":ID,
      ":code": `${code}\t` ,
      ":start": start,
      ":stop": end
    }
  }

  if(ID && token){
    params['FilterExpression'] = "contains(uID,:userID)  and contains(tokenName,:token)"
    params['ExpressionAttributeValues'][":userID"] = ID
    params['ExpressionAttributeValues'][":token"] = token
  }
  else if(ID){
    params['FilterExpression'] = "contains(uID,:userID)"
    params['ExpressionAttributeValues'][":userID"] = ID

  }else if(token){

    params['FilterExpression'] = "contains(tokenName,:token)"
    params['ExpressionAttributeValues'][":token"] = token
  }else{

  }



  return new Promise(res => {
    ConnectDB.query(params, function (err, data) {

      if (err) {
        
        pinolog.info({
          "function": "Get_activity_log_specify",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })
      } else {
        pinolog.info({
          "function": "Get_activity_log_specify",
          "detail": params,
          "res": true,
          "msg": "Search log success."
        })
        
        res({
          data

        })
      }

    });
  })

}

// search  activity log in database
function Get_activity_log(start, end,limit) {

  // console.log(start);
  // console.log(end);
  var params = {
    TableName: Log_table,
    FilterExpression: "#dt  between :start and :stop",
    Limit: limit ,
    ExpressionAttributeNames: {
      "#dt": "dt"
    },
    ExpressionAttributeValues: {
      ":start": start,
      ":stop": end
    }
  }

  return new Promise(res => {
    ConnectDB.scan(params, function (err, data) {

      if (err) {

        pinolog.info({
          "function": "Get_activity_log",
          "detail": params,
          "res": false,
          "msg": err.message
        })

        res({
          "res": false,
          "msg": err.message
        })
      } else {

        pinolog.info({
          "function": "Get_activity_log",
          "detail": params,
          "res": true,
          "msg": "Search log success."
        })

        res({
          data

        })
      }

    });
  })

}



module.exports = {
  date_Create, Create_Token, Create_Log, Get_List_Token, Delete_Token, Deactivate, Login_Token, Get_activity_log, Get_activity_log_specify
}
