const https = require("https");
const querystring = require("querystring");
const accessTokenHost = "www.linkedin.com";

class LinkedIn {
	constructor(code, options, fields) {
		this._code = code;
		this._options = options;
		this._fields = fields;
	}

	getAccessToken() {
		return new Promise((resolve, reject) => {
			const postData = querystring.stringify({
				grant_type: "authorization_code",
				client_id: this._options.clientID,
				client_secret: this._options.clientSecret,
				redirect_uri: this._options.redirectURL,
				code: this._code
			});

			// request option
			const options = {
				host: accessTokenHost,
				port: 443,
				method: "POST",
				path: "/oauth/v2/accessToken",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Content-Length": postData.length
				}
			};

			// request object
			var req = https.request(options, function(res) {
				var result = "";
				res.on("data", function(chunk) {
					result += chunk;
				});
				res.on("end", function() {
					if (
						result.status &&
						result.status > LinkedIn.ResponseCodes.ERRORS
					) {
						return reject(result);
					}

					resolve(result);
				});
				res.on("error", function(err) {
					reject(err);
				});
			});

			// req error
			req.on("error", function(err) {
				reject(err);
			});

			//send request witht the postData form
			req.write(postData);
			req.end();
		});
	}
}

LinkedIn.ResponseCodes = {
	SUCCESS: 200,
	ERRORS: 400
};

module.exports = LinkedIn;
