var Resource = require('deployd/lib/resource')
    , util = require('util')
    , MisfitAPI = require('misfit-cloud-api');


function MisfitResource(name, options) {
    Resource.apply(this, arguments);
    var mySettings = {
        clientKey: options.config.appKey,
        clientSecret: options.config.appSecret,
        redirect_uri: options.config.redirectUrl,
    };


    this.authorize = function (next) {
        var misfitApi = new MisfitAPI(mySettings);
        misfitApi.authorize(function (err, redirectURL) {
            next(redirectURL);
        });
    };

    this.getAccessToken = function (theCode, next) {
        var misfitApi = new MisfitAPI(mySettings);
        misfitApi.exchange(theCode, function (err, token) {
            if (err) {
                next(err);
                return false;
            }
            next(token);
        });
    }

    this.getProfile = function (token, next) {
        var misfitApi = new MisfitAPI(mySettings);
        misfitApi.getProfile({token: token}, function (err, profile) {
            if (err) {
                next(err);
                return false;
            } else if (profile && profile.userId) {
                next(profile);
                //do what ever you want with the profile, like login.
            } else {
                next({error: "profile can not be retrieved"});
                //exception?
            }
        })

    };

    this.getSummary = function (body, next) {
        var misfitApi = new MisfitAPI(mySettings);
        if (body.token && body.startDate && body.endDate && body.detail !== undefined) {
            misfitApi.getSummary({
                    token: body.token,
                    start_date: body.startDate,
                    end_date: body.endDate,
                    detail: body.detail
                },
                function (err, result) {
                    if (err || !result) {
                        next(err);
                        return false;
                    } else {
                        next(result);
                    }
                    //iterate result.summary array here
                    /* example:
                     date: "2014-08-18"
                     points: 278
                     steps: 1940
                     calories: 2147.7344
                     activityCalories: 521.2341
                     distance: 0.9178
                     */
                });
        } else {
            next({error: "body is not completed"});
        }


    };

}

util.inherits(MisfitResource, Resource);

MisfitResource.label = "Misfit";
MisfitResource.events = ["get", "post"];


MisfitResource.prototype.clientGeneration = true;


MisfitResource.basicDashboard = {
    settings: [
        {
            name: 'appKey',
            type: 'text',
            description: 'The application key. (client key)'
        }, {
            name: 'appSecret',
            type: 'text',
            description: 'The application Secret'
        }, {
            name: 'redirectUrl',
            type: 'text',
            description: 'The redirect url'
        }
    ]
};


MisfitResource.prototype.handle = function (ctx, next) {
    var parts = ctx.url.split('/').filter(function (p) {
        return p;
    });

    var result = {};

    var domain = {
        url: ctx.url
        , parts: parts
        , query: ctx.query
        , body: ctx.body
        , 'this': result
        , setResult: function (val) {
            result = val;
        }
    };


    if (ctx.method === "GET") {
        if (ctx.query.code && this.events.get) {
            // if the code is there then
            var self = this;
            this.getAccessToken(ctx.query.code, function (msg) {
                domain.misfitToken = msg;
                self.events.get.run(ctx, domain, function (err) {
                    ctx.done(err, result);
                });
            });
        } else {
            this.authorize(function (redirectURL) {
                ctx.res.setHeader("Location", redirectURL);
                ctx.res.statusCode = 302;

                ctx.done(null, 'This page has moved to ' + redirectURL);
            });
        }
    } else if (ctx.method === "POST" && this.events.post) {
        domain.getSummary = this.getSummary;
        domain.getProfile = this.getProfile;
        this.events.post.run(ctx, domain, function (err) {
            ctx.done(err, result);
        });

    } else {
        next();
    }
};

module.exports = MisfitResource;
