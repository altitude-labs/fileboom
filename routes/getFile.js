var	redis   = require("redis").createClient(),
	fs      = require("fs"),
	mime    = require("mime");

// test tokens
// redis.set("fileboom.tokens.files.fqjemkzjgsfe45fes453fq", "doge.png");
// redis.set("fileboom.tokens.dl.fqjemkzjgsfe45fes453fq", 10);

module.exports = function(req, res){

	// Retrieve token from redis
	redis.get("fileboom.tokens.files."+req.query.token, function(err, filename){

		// redis server error
		if(err){
			res.writeHead(500);
			res.end("Such fail");
			return;
		}

		// token not found
		if(filename === null){
			res.writeHead(404);
			res.end("Poor shibe, file not found");
			return;
		}

		// Check if remaining downloads is positive
		redis.get("fileboom.tokens.dl."+req.query.token, function(err, remaining){
			// redis server error
			if(err){
				res.writeHead(500);
				res.end("Such fail");
				return;
			}

			var remaining_downloads = parseInt(remaining);

			if(remaining_downloads === 0){
				res.writeHead(403);
				res.end("Sorry, this token is no longer valid.");
				return;
			}

			// Get associated file from files/
			var file = fs.createReadStream(__dirname+"/../files/"+filename);

			file.on('open', function(){

				// remove 1 download token
				redis.decrby("fileboom.tokens.dl."+req.query.token, 1);

				// send the file
				res.writeHead(200, {
					"Content-Type":mime.lookup(filename),
					"Content-Disposition":"attachment; filename=\""+filename+"\""
				});
				file.pipe(res).on("end", function(){
					res.end();
				});
			});

			//in case the file is missing in directory
			file.on('error', function(err){
				res.writeHead(404);
				res.end("Poor shibe, file not found");
				return;
			});

		});

	});

}