const https = require("https");
const querystring = require("querystring");
const accessTokenHost = "www.linkedin.com";
const profileDetailsHost = "api.linkedin.com";

class LinkedIn {
	constructor(code, options, fields) {
		this._code = code;
		this._options = options;
		this._fields = fields;
	}

	getAccessToken() {
		return new Promise((resolve, reject) => {
			console.log("LINKEDIN getAccessToken",this._code,JSON.stringify(this._options,null,2),JSON.stringify(this._fields,null,2));
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
			console.log("LINKEDIN getAccessToken",postData,options);

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

			//send request with the postData form
			req.write(postData);
			req.end();
		});
	}

	getProfile(accessToken) {
		return new Promise((resolve, reject) => {
			let profile = {};
			const options = {
				host: profileDetailsHost,
				path: `/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`,
				method: "GET",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"cache-control": "no-cache",
					"X-Restli-Protocol-Version": "2.0.0"
				}
			};
			console.log("LINKEDIN getProfile",options);
			const profileRequest = https.request(options, function(res) {
				let data = "";
				res.on("data", chunk => {
					data += chunk;
				});

				res.on("end", () => {
					const profileData = JSON.parse(data);
					//console.log("passport-linkedin-token-v2",profileData);
					if (!profileData.id) {
						//console.error("Linkedin BAD token");
						reject(profileData);
						return;
					}
					profile.id = profileData.id;
					const firstName =
						profileData.firstName.localized[
							Object.keys(profileData.firstName.localized)[0]
						];
					const lastName =
						profileData.lastName.localized[
							Object.keys(profileData.lastName.localized)[0]
						];

					profile.name = {
						givenName: firstName,
						familyName: lastName
					};

					profile.displayName = firstName + " " + lastName;

					if (
						profileData.profilePicture &&
						profileData.profilePicture["displayImage~"] &&
						profileData.profilePicture["displayImage~"].elements &&
						profileData.profilePicture["displayImage~"].elements
							.length > 0
					) {
						profile.photos = profileData.profilePicture[
							"displayImage~"
						].elements.reduce(function(memo, el) {
							if (
								el &&
								el.identifiers &&
								el.identifiers.length > 0
							) {
								memo.push({
									value: el.identifiers[0].identifier
								}); // Keep the first pic for now
							}
							return memo;
						}, []);
					}

					profile._profileRaw = data;
					profile._profileJson = profileData;
					resolve(profile);
				});

				res.on("error", function(err) {
					reject(err);
				});
			});

			// req error
			profileRequest.on("error", function(err) {
				reject(err);
			});

			profileRequest.end();
		});
	}

	getEmail(accessToken) {
		return new Promise((resolve, reject) => {
			let profile = {};
			try {
				const emailOptions = {
					host: profileDetailsHost,
					path: `/v2/emailAddress?q=members&projection=(elements*(handle~))`,
					method: "GET",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"cache-control": "no-cache",
						"X-Restli-Protocol-Version": "2.0.0"
					}
				};
				console.log("LINKEDIN getEmail",emailOptions);
				const emailRequest = https.request(emailOptions, function(res) {
					let data = "";
					res.on("data", chunk => {
						data += chunk;
					});

					res.on("end", () => {
						const profileData = JSON.parse(data);
						if (
							profileData.elements &&
							profileData.elements.length > 0
						) {
							profile.emails = profileData.elements.reduce(
								function(memo, el) {
									if (
										el["handle~"] &&
										el["handle~"].emailAddress
									) {
										memo.push({
											value: el["handle~"].emailAddress
										});
									}
									return memo;
								},
								[]
							);
						}

						profile._emailRaw = data;
						profile._emailJson = profileData;
						resolve(profile);
					});

					res.on("error", function(err) {
						reject(err);
					});
				});

				// req error
				emailRequest.on("error", function(err) {
					reject(err);
				});

				emailRequest.end();
			} catch (error) {
				reject(error);
			}
		});
	}

	getProfileDetails(accessToken) {
		return new Promise((resolve, reject) => {
			let profile = { provider: "linkedin" };
			this.getProfile(accessToken)
				.then(profileData => {
					profile = { ...profile, ...profileData };
					if (this._options.scope.includes("r_emailaddress")) {
						return this.getEmail(accessToken);
					} else resolve(profile);
				})
				.then(emailData => {
					profile = { ...profile, ...emailData };
					resolve(profile);
				})
				.catch(error => {
					reject(error);
				});
		});
	}
}

LinkedIn.ResponseCodes = {
	SUCCESS: 200,
	ERRORS: 400
};

module.exports = LinkedIn;
