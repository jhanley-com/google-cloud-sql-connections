var fs = require('fs');
var mysql = require('mysql');
var myconfig = require('./myconfig.json');

function db_test() {
	var pool = mysql.createPool({
		host: myconfig.host,
		user: myconfig.user,
		password: myconfig.password,
		ssl : {
			ca: fs.readFileSync(myconfig.ssl.ca),
			key: fs.readFileSync(myconfig.ssl.key),
			cert: fs.readFileSync(myconfig.ssl.cert)
		}
		connectionLimit: 8,
		waitForConnections: false
	});

	db_listDatabases(pool);
}

function db_listDatabases(pool) {
	pool.query('SHOW DATABASES', function (error, results, fields) {
		if (error) {
			console.log("Error: Cannot query databases");

			if ("sqlMessage" in error) {
				console.log(error.errno + " : " + error.sqlMessage);
			} else {
				console.log(error);
			}

			return;
		}

		console.log('DATABASES');
		console.log('--------------------');
		Object.keys(results).forEach(function(key) {
			var row = results[key];
			console.log(row.Database)
		});

		// This program is complete. Close all connections in the pool
		pool.end(function (err) {
			//
		});
	});
}

db_test();
