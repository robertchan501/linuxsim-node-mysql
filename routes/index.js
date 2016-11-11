var express = require('express');
var router = express();

/**********************************************************	 array 	*********************************************/
var array = require('array');
var datetime = require('node-datetime');
 var util = require('util');

/******************************************** session initialization ********************************************************/
var session = require('express-session');
var FileStore = require('session-file-store')(session);

/**********************************************  Mysql connect  ***************************************************************/
var mysql      = require('mysql');

var db_config_heroku = {
  host     : 'us-cdbr-iron-east-04.cleardb.net',
  user     : 'b45bc5f30e023a',
  password : '7ef43475',
  database : 'heroku_8bf7ec3ebd6c325'
};

var connection;

function continue_connect(){
	connection = mysql.createConnection(db_config_heroku);

	connection.connect(function(err){
		if(err) {                                     // or restarting (takes a while sometimes).
	      setTimeout(continue_connect, 2000); // We introduce a delay before attempting to reconnect,
	    }
	});

	connection.on('error', function(err){
	    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
	      continue_connect();                         // lost due to either server restart, or a
	    } else {                                      // connnection idle timeout (the wait_timeout
	      throw err;
	    }  
	});
}
continue_connect();
router.use(session({
  	name  : 'server-session-cookie-id',
	secret: 'my express secret',
	saveUninitialized: true,
	resave: true,
	store: new FileStore()
}));

/* GET home page. */
router.get('/', function(req, res, next) {
  	connection.query('SELECT * FROM `modules` ORDER BY id ASC', function(err, rows, fields) {
	  if (!err){
	  	if(req.session.userid != undefined){
	  		res.render('index', { title: 'LinuxSim', page: 'index', session_id: req.session.userid, all_row: rows});
	  	} else {
	  		res.render('index', { title: 'LinuxSim', page: 'index', session_id: '', all_row: rows});
	  	}
	  }
	});
});
/* GET Contact page. */
router.get('/contact', function(req, res, next){
	connection.query('SELECT * FROM `modules` ORDER BY id ASC', function(err, rows, fields) {
	  	if (!err){
	  		if(req.session.userid != undefined){    
				res.render('contact', {title: 'Contact', page: 'contact', session_id: req.session.userid, all_row: rows, send_data: 'Send comments and inquires to info@linuxsim.com'});
			} else {
				res.render('contact', {title: 'Contact', page: 'contact', session_id: '', all_row: rows, send_data: 'Send comments and inquires to info@linuxsim.com'});
			}	
		}
	}); 	
});
/* GET Module page. */
router.get('/modules', function(req, res, next){
	connection.query('SELECT * FROM `modules` ORDER BY id ASC', function(err, rows, fields) {
		if(!err){
		  	if(req.session.userid != undefined){
		  		res.render('modules', {page: 'modules', title: rows[0].title, session_id: req.session.userid, i_d: '1', all_row: rows});
		  	} else {
		  		res.render('modules', {page: 'modules', title: 'Modules', session_id: '', i_d: '', all_row: rows});
		  	}
		}
	});
});
/* GET Exercises page. */
router.get('/exercises', function(req, res, next){
	connection.query('SELECT * FROM `exercises` ORDER BY id ASC', function(err, rows, fields) {
	  if (!err)	{    
			if(req.session.userid != undefined){	
				res.render('exercises', {page: 'exercises', title: 'Exercises', session_id: req.session.userid, i_d: '1', all_row: rows});
			} else {
				res.render('exercises', {page: 'exercises', title: 'Exercises', session_id: '', i_d: '', all_row: rows});
			}
	   }	
	}); 	
});
/* GET Login page. */
router.get('/login', function(req, res, next){
	connection.query('SELECT * FROM `modules` WHERE id=3', function(err, rows, fields) {
	  if (!err)	    
		res.render('login', {page: 'login', title: 'Login'});
	}); 	
});
/* GET SignUp page. */
router.get('/signup', function(req, res, next){
	connection.query('SELECT * FROM `modules` WHERE id=3', function(err, rows, fields) {
	  if (!err)	    		
	  res.render('signup', {page: 'signup', title: 'Signup'});
	}); 
});



/* Paypal pay status(This section will be controlled regarding to paypal return value) */

router.get('/paypal_active', function(req, res){
	req.session.paycount += 1;
	console.log("Paypal_active#########################################################################" + req.session.paycount);
	console.log(util.inspect(req.body));
  	if(req.body.st == 'Completed'){

  		console.log('Please confirm your pay status: *****' + req.body);


  		var dt = datetime.create();
		var pay_start_date = dt.format('Y-m-d');	
		var month = parseInt(dt.format('m'));	
		var day = dt.format('d');
		if(month == 12){
			var year = parseInt(dt.format('Y')) + 1;
			month = '1';			
		} else {
			var year = dt.format('Y');
			month = month + 1;
		}
		var pay_end_date = year + "-" + month + "-" + day;
	  	if(req.session.userid > 0){
	  		var queryString = 'UPDATE `users` SET `pay_status`="on", `pay_start_date`="'+pay_start_date+'", `pay_end_date`="'+pay_end_date+'" WHERE `id`="'+req.session.userid+'"';
	  		connection.query(queryString, function(err){
	  			if(!err){
	  				connection.query('SELECT * FROM `users`WHERE ?', {'id': req.session.userid}, function(err, rows, fields){
						req.session.username = "";
						req.session.email = "";
						req.session.password = "";
						req.session.fullname = "";
						req.session.created = "";
						res.render('index', { title: 'LinuxSim', page: 'index', session_id: req.session.userid, all_row: rows, paypal_result: req.body});
					});
	  			}
	  		});
	  	} else {	
	  		var queryString = 'INSERT INTO `users`(username, email, password, fullname, created, pay_status, pay_start_date, pay_end_date)VALUES("'+req.session.username+'","'+req.session.email+'","'+req.session.password+'","'+req.session.fullname+'","'+req.session.created +'",on"'+pay_start_date+'","'+pay_end_date+'")';
	  		connection.query(queryString, function(err){
				if(!err){
					connection.query('SELECT * FROM `users`WHERE ?', {'email': req.session.email}, function(err, rows, fields){
						req.session.username = "";
						req.session.email = "";
						req.session.password = "";
						req.session.fullname = "";
						req.session.created = "";
						req.session.userid = rows[0].id;
						res.render('index', { title: 'LinuxSim', page: 'index', session_id: req.session.userid, all_row: rows, paypal_result: req.body});
					});
				} else {
					res.send(err);
				}
			});
		}	
  	} else if(req.body.amt > 0) {
  		req.session.username = "";
		req.session.email = "";
		req.session.password = "";
		req.session.fullname = "";
		req.session.created = "";		
		var queryString = "DELETE FROM `users` WHERE `id`='" + req.session.userid + "'" ;
		connection.query(queryString, function(err){
			res.render('signup', {paypal_active : 'Paypal connection was canceled, therefore you have to sign up again.'});	
		});		
  	} else {
  		res.render('paypal_active', { title: 'LinuxSim', page: 'index', session_id: '', all_row: "", paypal_result: req.body});
  	}
});




/*****************************************************************************************************************************************************/
/* POST method Ajax (for terminal)*/
router.post('/modules-exercises', function(req, res){
	var page = req.body.page;
	if(page == 'modules'){
		delete req.body.page;
		connection.query('SELECT command, result FROM `modules` WHERE ?', req.body, function(err, rows, fields) {
		  if (!err)
			res.send(rows);
		  else
		    res.send(err);
		});
	} else {
		delete req.body.page;
		connection.query('SELECT command FROM `exercises` WHERE ?', req.body, function(err, rows, fields) {
		  if (!err)
			res.send(rows);
		  else
		    res.send(err);
		});
	}	
});

// FROM home page module name TO appropriated module name of modules page
router.post('/modules', function(req, res){ //console.log('at modules: ',res);
	var row_id = req.body.row_id;
	if (req.body.page == 'index') {
		connection.query('SELECT * FROM `modules` ORDER BY id ASC', function(err, rows, fields) {
			var module_title = '';	
			rows.forEach(function(row){
				if(row.id == row_id)
				   module_title = row.title;
			});	

		    if( req.session.userid != undefined){	
				res.render('modules', {page: 'modules', title: module_title, session_id: req.session.userid, i_d: row_id, all_row: rows});
			} else {
				res.render('modules', {page: 'modules', title: module_title, session_id: '', i_d: row_id, all_row: rows});
			}
		});
	} else {
		delete req.body.page;
		var post = {'id': req.body.row_id};
		connection.query('SELECT * FROM `modules` WHERE ?', post, function(err, rows, fields) {
			if (!err)
				res.send(rows);
		  	else
		    	res.send(err);  
		});  
	}	
});

/* exercises page*/
router.post('/exercises', function(req,res){
	var id = req.body.id; 
	if (req.body.page == 'index') {
		connection.query('SELECT * FROM `exercises` ORDER BY id ASC', function(err, rows, fields) {
			var module_title = '';	
			rows.forEach(function(row){
				if(row.id == id){
				   module_title = row.title;
				}
			});	

		    if(req.session.userid != undefined){	
				res.render('exercises', {page: 'exercises', title: module_title, session_id: req.session.userid, i_d: id, all_row: rows});
			} else {
				res.render('exercises', {page: 'exercises', title: module_title, session_id: '', i_d: id, all_row: rows});
			}
		});
	} else {
		join_data = array();
		var queryString = "SELECT m.*, em.`step_order`, em.`step_title`, em.`step_description` FROM exercise_modules AS em LEFT JOIN modules AS m ON m.id=em.module_id WHERE em.exercise_id='"+ id +"' ORDER BY em.step_order ASC";
		connection.query(queryString, function(err, rows, fields) {
			if (!err){
				join_data.push(rows);
				queryString = "SELECT `title` FROM `exercises` WHERE id='"+ id +"'";
				connection.query(queryString, function(err, rows, fields){
					if(!err){
						join_data.push(rows);
						res.send(join_data);
					} else {
						res.send(err);
					}
				});
			} else {
		    	res.send(err);  
		  	}
		});	
	}	
});

/*  SignUp page */
router.post('/signup', function(req, res){
	req.session.paycount = 0;
	console.log('signup^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
	console.log(util.inspect(req.body));
	var data = req.body;
	var queryString = 'SELECT * FROM `users` WHERE username="'+ data.username + '" AND email="'+ data.email +'"'; 
	connection.query(queryString, function(err, rows,fields){
		if(err){
			res.send(err);
		}else{
			if(rows['length'] > 0){		// If data is already existing.
				//res.send(rows);
				if(row[0].pay_status == 'ON'){
					req.session.userid = rows[0].id;
					res.send({'status' : 'USING'});
				} else {
					req.session.userid = rows[0].id;
					res.send({'status' : 'EXISTING'});
				}
			}else{				
				req.session.username = data.username;
				req.session.email = data.email;
				req.session.password = data.password;
				req.session.fullname = data.fullname;
				req.session.created = data.created;
				res.send({'status': 'OK'});
			}
		}
	});
});
/*  Login page */
router.post('/login', function(req, res){ 
	console.log('login%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
	console.log(util.inspect(req.body));
	var data = req.body;
	var password = data.password;
	delete data.password;

	connection.query('SELECT * FROM `users`WHERE ?', data , function(err, rows, fields){  // check out with paypal status
		if(!err){
			if(rows['length'] > 0){
				for (var i = 0; i < rows['length']; i++) {			
					if(rows[i].password == password){
						// getting selected session info
						if(rows[i].pay_status == 'on'){
							req.session.userid = rows[i].id;
							res.send({'status':'ON'});	
						} else {
							req.session.userid = "";
							res.send({'status':'OFF'});
						}						
					}
				}

			} else {
				res.send({'status':'NO'});
			}
		} else {
			res.send(err);
		}
	});
});

/* logout */
router.post('/logout', function(req, res){
	var session_id = req.body.session_id;
	if(req.session.userid == session_id){
		req.session.userid = '';
		res.send({'status': 'SUCCESS'});
	} else {
		res.send({'status': 'BAD'});
	}
});

module.exports = router;