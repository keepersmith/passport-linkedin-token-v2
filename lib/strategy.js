const LinkedIn = require("./linkedin");

class LinkedInTokenStrategy {
	constructor(options, verify) {
		console.log("Options, Verify", options, verify);
		this._options = options;
		this._verify = verify;
	}

	authenticate(req, options) {
		if (req.query && req.query.denied) {
			return this.fail();
		}

		const code = req.body.access_token || req.query.access_token;

		this.loadUserProfile(code, (err, profile) => {
			if (err) {
				return this.error(err);
			}

			const verified = (err, user, info) => {
				if (err) {
					return this.error(err);
				}
				if (!user) {
					return this.fail(info);
				}
				this.success(user, info);
			};

			this._verify(profile, verified);
		});
	}

	loadUserProfile(code, res) {
		// let fields = "id,first-name,last-name,public-profile-url";
		// if (this._profileFields) {
		// 	fields = this.convertProfileFields(this._profileFields);
		// }
		const linkedProfile = new LinkedIn(code, this._options, "fields");
		linkedProfile
			.getAccessToken()
			.then(data => {
				data = JSON.parse(data);
				return linkedProfile.getProfileDetails(data.access_token);
			})
			.then(data => {
				console.log("data2222!!!!", data);
				res(null, data);
			})
			.catch(err => res(err));
	}
}

module.exports = LinkedInTokenStrategy;
