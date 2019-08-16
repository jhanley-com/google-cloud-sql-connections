var fs = require('fs');
var mysql = require('mysql');
var myconfig = require('./myconfig.json');

function db_test() {
	var con = mysql.createConnection({
		host: myconfig.host,
		user: myconfig.user,
		password: myconfig.password,
		ssl : {
			ca: fs.readFileSync(myconfig.ssl.ca),
			key: fs.readFileSync(myconfig.ssl.key),
			cert: fs.readFileSync(myconfig.ssl.cert)
		}
	});

	con.connect(function(error) {
		if (error) {
			console.log("Error: Cannot connect to server: " + myconfig.host);

			if ("sqlMessage" in error) {
				console.log(error.errno + " : " + error.sqlMessage);
			} else {
				console.log(error);
			}

			return;
		}

		db_listDatabases(con);
	});
}

function db_listDatabases(con) {
	con.query('SHOW DATABASES', function (error, results, fields) {
		if (error) {
			console.log("Error: Cannot query databases");

			if ("sqlMessage" in error) {
				console.log(error.errno + " : " + error.sqlMessage);
			} else {
				console.log(error);
			}

			con.end();

			return;
		}

		console.log('DATABASES');
		console.log('--------------------');
		Object.keys(results).forEach(function(key) {
			var row = results[key];
			console.log(row.Database)
		});
		con.end();
	});
}

db_test();
