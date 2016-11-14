var request = require('request');
var config = require('./config');

module.exports = function(host_name) {
    var API_KEY = config.API_KEY;
    var SECRET_KEY = config.SECRET_KEY;
    var CONNECT_URL = 'https://www.dailymotion.com/oauth/authorize?response_type=code&client_id=' + API_KEY + '&redirect_uri=' + host_name +'/api/auth/callback&scope=userinfo+manage_videos+read_insights+email+manage_comments+manage_playlists+manage_tiles+manage_subscriptions+manage_friends+manage_favorites';
    var LIMIT = 10;

    var params = {
        'client_id': API_KEY,
        'client_secret': SECRET_KEY
    };

    var get_refresh_token = function(code, callback) {
        var requestParams = JSON.parse(JSON.stringify(params));
        requestParams.code = code;
        requestParams.grant_type = 'authorization_code';
        requestParams.redirect_uri = host_name + '/api/auth/callback';
        var options = {
            uri: 'https://api.dailymotion.com/oauth/token',
            method: 'POST',
            form: requestParams
        };
        request(options, function(error, response, body) {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback({ 'error': error });
            }
        } );
    };

    var get_access_token = function(refresh_token, callback) {
        var requestParams = JSON.parse(JSON.stringify(params));
        requestParams.refresh_token = refresh_token;
        requestParams.grant_type = 'refresh_token';
        requestParams.redirect_uri = host_name + '/api/auth/callback';
        var options = {
            uri: 'https://api.dailymotion.com/oauth/token',
            method: 'POST',
            form: requestParams
        };
        request(options, function(error, response, body) {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback({ 'error': error });
            }
        } );
    };

    var get_user_info = function(access_token, callback) {
        var options = {
            uri: 'https://api.dailymotion.com/me',
            method: 'GET',
            qs: {
                access_token: access_token,
                fields: 'email,first_name,last_name,id,avatar_720_url,videos_total,screenname',
            }
        };
        request(options, function(error, response, body) {
            if (!error) {
                console.log('USER INFO', body);
                callback(JSON.parse(body));
            } else {
                console.log(error);
            }
        });
    };

    var get_upload_url = function(access_token, callback) {
        var options = {
            uri: 'https://api.dailymotion.com/file/upload',
            method: 'GET',
            qs: {
                access_token: access_token
            }
        };

        request(options, function(error, response, body) {
            if (!error) {
                console.log(body);
                callback(JSON.parse(body).upload_url);
            } else {
                console.log(error);
                callback(null);
            }
        });
    };

    var create_video = function(access_token, metadata, video_url, callback) {
        var options = {
            uri: 'https://api.dailymotion.com/me/videos',
            method: 'POST',
            qs: {
                access_token: access_token,
                fields: 'status'
            },
            form: {
                title: metadata.title,
                description: metadata.description,
                url: video_url,
                published: true,
                channel: 'tv'
            }
        };

        request(options, function(error, response, body) {
            console.log("Finish upload");
            console.log(body);
            if (error) {
                callback({'error': error});
            } else {
                callback(JSON.parse(body));
            }
        });
    };

    var get_video_details = function(access_token, video_id, callback) {
        var options = {
            uri: 'https://api.dailymotion.com/video/' + video_id,
            method: 'GET',
            qs: {
                access_token: access_token,
                fields: 'url,thumbnail_url,embed_url,title,description,created_time'
            }
        };

        request(options, function(error, response, body) {
            console.log("get_video_details", body);
            if (error) {
                callback({'error': error});
            } else {
                callback(JSON.parse(body));
            }
        });
    };

    var unpublish_video = function(access_token, video_id, callback) {
        var options = {
            uri: 'https://api.dailymotion.com/video/' + video_id,
            method: 'DELETE',
            qs: {
                access_token: access_token
            }
        };

        request(options, function(error, response, body) {
            console.log("unpublish_video", body);
            if (error) {
                callback({'error': error});
            } else {
                callback(JSON.parse(body));
            }
        });
    };

    var _video_translator = function(video_data) {
        return {
            video_id: video_data.id,
            video_url: video_data.url,
            thumbnail_url: video_data.thumbnail_url,
            video_embed_url: video_data.embed_url,
            title: video_data.title,
            description: video_data.description,
            created_time: video_data.created_time,
        };
    };
    var get_video_list = function(access_token, next_page_token, callback) {
        var options = {};

        if (!next_page_token) {
            next_page_token = 1;
        }

        options = {
            uri: 'https://api.dailymotion.com/me/videos',
            method: 'GET',
            qs: {
                'fields': 'embed_url,url,description,title,id,channel,thumbnail_url,duration,private,channel,language,tags,created_time',
                'limit': LIMIT,
                'page': next_page_token,
                'access_token': access_token
            }
        };

        request(options, function(error, response, body) {
            console.log("get_video_list", body);
            if (error) {
                callback({'error': error});
            } else {
                // translate data
                var returnData = {};
                var data = [];
                var paging = {
                    'previous': null,
                    'next': null
                };
                json_data = JSON.parse(body);
                current_page = json_data.page;
                if (current_page > 1) {
                    paging.previous = current_page - 1;
                }

                if (json_data.has_more) {
                    paging.next = current_page + 1;
                }

                if (json_data.list) {
                    for (var videoIndex in json_data.list) {
                        var videoItem = json_data.list[videoIndex];
                        var videoData = _video_translator(videoItem);
                        data.push(videoData);
                    }
                }
                returnData.paging = paging;
                returnData.data = data;
                callback(returnData);
            }
        });
    };



    return {
        get_refresh_token: get_refresh_token,
        get_access_token: get_access_token,
        get_user_info: get_user_info,
        get_upload_url: get_upload_url,
        create_video: create_video,
        get_video_details: get_video_details,
        unpublish_video: unpublish_video,
        get_video_list: get_video_list,
        CONNECT_URL: CONNECT_URL,
    };
};
