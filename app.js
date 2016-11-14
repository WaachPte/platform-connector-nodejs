var express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    querystring = require('querystring');

var app = express();
var port = process.env.PORT || 3000;
// var HOST_NAME = 'http://localhost:3000';
var HOST_NAME = 'https://dailymotion-connector.herokuapp.com'

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var appRouter = express.Router();

var REDIRECT_URL = '';
var dailymotionServices = require('./services/dailymotion')(HOST_NAME);

// Connect URL
appRouter.route('/api/auth/connect')
    .get(function(req, res) {
        REDIRECT_URL = req.query.redirect_uri;
        res.redirect(dailymotionServices.CONNECT_URL);
    });

// Callback URL
appRouter.route('/api/auth/callback')
    .get(function(req, res) {
        var code = req.query.code;
        var data = {};

        dailymotionServices.get_refresh_token(code, function(tokenBody) {
            data.access_token = tokenBody.access_token;
            data.refresh_token = tokenBody.refresh_token;

            var currentDate = new Date();
            currentDate.setHours(currentDate.getHours() + tokenBody.expires_in/3600);
            data.token_expire = parseInt(currentDate.getTime()/1000);
            var queryString = querystring.stringify(data);
            res.redirect(REDIRECT_URL + '?' + queryString);
        });
    });

// Refresh token URL
appRouter.route('/api/auth/refresh_token')
    .get(function(req, res) {
        var refresh_token = req.query.refresh_token;
        dailymotionServices.get_access_token(refresh_token, function(tokenBody) {
            if (tokenBody.error) {
                res.json({'error': tokenBody.error});
            } else {
                data = {};
                data.access_token = tokenBody.access_token;
                data.refresh_token = tokenBody.refresh_token;
                var currentDate = new Date();
                var expireDate = currentDate.setHours(currentDate.getHours() + tokenBody.expires_in/3600);
                data.token_expire = parseInt(expireDate.getTime()/1000);

                res.json(data);
            }
        });
    });

// Upload URL
appRouter.route('/api/upload')
    .post(function(req, res) {
        var access_token = req.body.access_token;
        var metadata = req.body.metadata;
        var video_url = req.body.video_url;

        dailymotionServices.get_upload_url(access_token, function(upload_url) {
            if (upload_url) {
                dailymotionServices.create_video(access_token, metadata, video_url, function(uploadRes) {
                    console.log('uploadRes', uploadRes);
                    if (uploadRes.error) {
                        var message = uploadRes.error.message? uploadRes.error.message: 'Upload Error';
                        res.json({'error': message});
                    } else {
                        var data = {};
                        data.video_id = uploadRes.id;
                        data.thumbnail_url = '';
                        data.video_url = '';
                        data.video_embedded_url = '';
                        data.test = 'Test';
                        res.json(data);
                    }
                });
            } else {
                res.json({'error': 'Can\'t get upload url'});
            }
        });

    });

// Channel Info URL
appRouter.route('/api/channel')
    .get(function(req, res) {
        var access_token = req.query.access_token;
        dailymotionServices.get_user_info(access_token, function(userInfoBody) {

            var data = {};
            data.email = userInfoBody.email;
            data.user_name = '';

            if (userInfoBody.first_name) {
                data.user_name += userInfoBody.first_name + ' ';
            }
            if (userInfoBody.last_name) {
                data.user_name += userInfoBody.last_name;
            }
            data.screen_name = userInfoBody.screenname;
            data.video_count = userInfoBody.videos_total? userInfoBody.videos_total: 0;
            data.channel_id = userInfoBody.id;
            data.photo_url = userInfoBody.avatar_720_url;
            res.json(data);
        });

    });

// Get video list URL
appRouter.route('/api/videos')
    .get(function(req, res) {
        var access_token = req.query.access_token;
        var page_token = req.query.page_token;
        console.log("page_token", page_token);
        dailymotionServices.get_video_list(access_token, page_token, function(videoList) {
            if (videoList.error) {
                res.json({'error': videoList.error});
            } else {

                res.json(videoList);
            }
        });
    });

// Get Video Detail URL
appRouter.route('/api/videos/:videoId')
    .get(function(req, res) {
        var access_token = req.query.access_token;
        var video_id = req.params.videoId;
        dailymotionServices.get_video_details(access_token, video_id, function(videoDetails) {
            if (videoDetails.error) {
                res.json({'error': videoDetails.error});
            } else {
                var returnData = {};
                // url,thumbnail_url,embed_url,title,description,created_time
                returnData.created_time = videoDetails.created_time;
                returnData.video_url = videoDetails.url;
                returnData.thumbnail_url = videoDetails.thumbnail_url;
                returnData.video_embed_url = videoDetails.embed_url;

                res.json(returnData);
            }
        });

    })
    .delete(function(req, res) {
        var access_token = req.query.access_token;
        var video_id = req.params.videoId;

        dailymotionServices.unpublish_video(access_token, video_id, function(deleteRes) {
            if (deleteRes.error) {
                res.json({'error': videoDetails.error});
            } else {
                res.json(deleteRes);
            }
        });
    });

app.use('/', appRouter);

app.listen(port, function () {
    console.log('Running on PORT: ' + port);
});
