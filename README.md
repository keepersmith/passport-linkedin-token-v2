# Passport-LinkedIn-Token-V2

[Passport](http://www.passportjs.org/) strategy for authenticating with LinkedIn OAuth2 tokens. It works for lite profile and email addresses.

## Installation

```
$ npm install passport-linkedin-token-v2
```

## Usage

### Configure Strategy

This LinkedIn authentication strategy authenticates users using a LinkedIn account and OAuth 2.0 authorization code. The strategy requires a verify callback, which accepts these credentials and calls done with the following options:

-   clientID: The API Key value generated when you registered your application.
-   clientSecret: The Secret Key value generated when you registered your application.
-   redirectURL: The URL your users are sent back to after authorization. This value must match one of the OAuth 2.0 Authorized Redirect URLs defined in your application configuration and must be the same one you specified while generation the authorization code.
-   scope: The member permissions your application is requesting on behalf of the user. It must be the same ones you specified while generation the authorization code.

```
passport.use(
	"candidate-linkedin",
	new LinkedInTokenStrategy(
		{
			clientID: env.LinkedInClientID,
			clientSecret: env.LinkedInClientSecret,
			redirectURL: env.LinkedInRedirectURL,
			scope: ["r_emailaddress", "r_liteprofile"]
		},
		async (req, accessToken, refreshToken, profile, done) => {
            User.findOrCreate({ linkedinId: profile.id }, function (err, user) {
                return done(err, user);
            });
        })
    )
```

### Obtain Authorization Code

The [react-linkedin-login-oauth2](https://www.npmjs.com/package/react-linkedin-login-oauth2) package is used to get authorization code for Linked In Log in feature using OAuth2 in a easy way, without redirecting your application to linked in authorization page. After have the authorization code, you can send it to server to continue to get information needed. They have a cool demo as well as source code if you get stuck.

### Sending Authorization Code to server

You can send the Authorization Code as an `access_token` to the Passport Strategy

**Client**

```
linkedinResponse = async response => {
    const { data: loginDetails } = await axios.post(
        "http://localhost:3030/api/auth/candidate/linkedin/login",
        {
            access_token: response.code
        }
    );
    console.log(loginDetails);
};

render() {
    return (
        <LinkedIn
            clientId="817XXXXXXXXr33"
            scope="r_liteprofile r_emailaddress"
            onFailure={this.linkedinResponse}
            onSuccess={this.linkedinResponse}
            redirectUri={`http://localhost:3000/api/auth/linkedin/callback`}
        />
    );
}
```

**Server**

```
passport.authenticate(
    "candidate-linkedin",
    { session: false },
    (error, user) => {
        // Your Logic to authenticate requests
    })
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker, You can mail me such security vulnerabilities at nkashter[at]gmail.com. The [Responsible Disclosure Program](https://auth0.com/responsible-disclosure-policy/) details the procedure for disclosing security issues.

## License

MIT
