const { Router } = require('express')
const router = Router()
const accountOp= require('../../model/query/account.js')
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false});
const bcrypt = require('bcryptjs');

// Import send email object
const nodemailer = require('nodemailer');
const config = require('../../model/config');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
})

router.post('/login', urlencodedParser, (req, res) => {
  const username = req.body.username;
  const pwd = req.body.password;
  // connect to mysql
  accountOp.login(username, pwd)
  .then(val => {
    /*
     * status code
     * 0 -> success
     * 1 -> wrong password
     * 2 -> wrong account
     */
    // TODO: need to get the permission from operation result.
    const result = {
      status: val,
      authUser: val === '0' ? username : null,
      isLogin: val === '0',
      role: val
    }
    if (val == '0') {
      // set session data
      req.session.authUser = username
      req.session.isLogin = true
      req.session.role = val
    }
    res.json(result)
  });
})

// logout
router.get('/logout',(req,res) => {
  console.log('logout!!')
  // remove local cookie.
  res.clearCookie('connect.sid');
  // remove the server store cookie.
  req.session.destroy();
  return res.redirect('/');
})

router.post('/registry',urlencodedParser,(req,res)=>{
  console.log(req.body);
  const username = req.body.username;
  const pwd = req.body.password;
  const name = req.body.name;
  const Email = req.body.email;
  const college = req.body.college;
  const department = req.body.department;
  const grade = req.body.grade;
  // regist time 
  const time = Date.now();
  const str = Email + '/' + time;
  //encrypt
  const passkey = encrypt(str,"test");
  let options = {
    from: config.email.user,
    to: Email,
    subject: 'Authorization for NCKU-SU',
    text: '<a href="http://localhost:3000/verify?token=' + passkey + '"> 點擊激活帳號 </a>'
  }
  transporter.sendMail( options , (error,info) => {
    if(error) console.log(error);
    else console.log('Sending email: ' + info.response);
  })
})


router.get('./verify',(req,res)=>{
  let token = req.query.token;
  //decrypt
  let str = decrypt(token,"test");
  let Email = str.split('/')[0];
  let time = parseInt(str.split('/')[1]);
  let diffTime = parseInt(Date.now()) - time ;
  //set expired time for 30 mins
  if( diffTime > 1000*60*30 ){
    console.log("Expired!!");
  } else {
    // make user finish 
    console.log("success!!");
  }
  // direct to registry
  return res.redirect('../../account/registry');
})

module.exports = router;
