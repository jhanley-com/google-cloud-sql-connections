var fs = require('fs');
var mysql = require('mysql');
var myconfig = require('./myconfig_pool_proxy_unix.json');

var count = 0;

var poolconfig = myconfig


// https://github.com/mysqljs/mysql#poolcluster-options
var clusterConfig = {
	canRetry: true,
	removeNodeErrorCount: 5,
	// restoreNodeTimeout: 60,		// Wait one minute
	restoreNodeTimeout: 5,			// Wait five seconds
	// RR, RANDOM, ORDER
	defaultSelector: 'RR',
	connectionLimit: 8,
	waitForConnections: false
}

var pool = mysql.createPoolCluster(clusterConfig);

pool.add('MASTER', poolconfig.masterConfig);
pool.add('SLAVE1', poolconfig.slaveConfig_1);
pool.add('SLAVE2', poolconfig.slaveConfig_2);

process.on('SIGINT', function() {
	console.log("");
	console.log("Caught interrupt signal");

	// This program is complete. Close all connections in the pool
	pool.end(function (err) {
		//
	});

	process.exit(1);
});

function debugMessage(count, host, port) {
	return count + ": " + new Date().toISOString() + ": " + getHost(host, port);
}

function getHost(ipaddr, port) {
	if (ipaddr == poolconfig.masterConfig.host && port == poolconfig.masterConfig.port) {
		return "MASTER";
	}

	if (ipaddr == poolconfig.slaveConfig_1.host && port == poolconfig.slaveConfig_1.port) {
		return "FAILOVER";
	}

	if (ipaddr == poolconfig.slaveConfig_2.host && port == poolconfig.slaveConfig_2.port) {
		return "SLAVE #2";
	}

	return ipaddr + ":" + port;
}

function db_test() {
	db_listDatabases(0);
}

function db_listDatabases(retry) {
	// pool.getConnection('MASTER', function(error, connection) {
	// pool.getConnection('SLAVE*', function(error, connection) {

	pool.getConnection(function(error, connection) {
		if (error) {
			console.log("---------------------------------------------");
			console.log("Error: Cannot connect to server")
			console.log(new Date().toISOString());
			console.log(error.code);

			if (error.code == "ETIMEDOUT") {
				console.log("Retrying ...");
				db_listDatabases(retry + 1);
				return;
			}

			if (error.code == "ECONNREFUSED") {
				console.log("Retrying ...");
				db_listDatabases(retry + 1);
				return;
			}

			// PROTOCOL_CONNECTION_LOST probably means the wrong SSL certificate

			if (retry == 0) {
				console.log("Retrying ...");
				db_listDatabases(retry + 1);
				return;
			}

			console.log("Retry failed");

			return;
		}

		count += 1;

		host = connection.config.host
		port = connection.config.port

		msg = debugMessage(count, host, port);

		msg += "        \r";

		process.stdout.write(msg);

		connection.query('SHOW DATABASES', function (error, results, fields) {
			if (error) {
				console.log("---------------------------------------------");
				console.log(debugMessage(count, host, port));

				console.log("Error: Cannot query databases: " + error.code + " retrying");

				if (retry == 0) {
					db_listDatabases(retry + 1);
					return;
				}

				console.log("Retry failed");

				connection.release();

				return;
			}

			console.log("DATABASES on " + getHost(host, port) + "                    ");
			console.log('--------------------');
			Object.keys(results).forEach(function(key) {
				var row = results[key];
				console.log(row.Database)
			});

			connection.release();

			// This program is complete. Close all connections in the pool
			pool.end(function (err) {
				//
			});
		});
	});
}

db_test()
