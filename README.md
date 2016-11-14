# Platform Connector NodeJS Example
This repository is an implementation of waach Platform connector to connect/upload to Dailymotion.

For document details , please check http://docs.waachplatformconnector.apiary.io/#


# How to run

1. Register a new application at http://www.dailymotion.com/settings/developer
2. Get `API Key` and `API Secret` and put in `./services/config.js`
3. Run server

```
$ npm install
$ gulp
[11:13:56] Starting 'default'...
[11:13:56] Finished 'default' after 192 ms
[11:13:56] [nodemon] 1.11.0
[11:13:56] [nodemon] to restart at any time, enter `rs`
[11:13:56] [nodemon] watching: *.*
[11:13:56] [nodemon] starting `node app.js`
```

# Deployment

Remember to change `HOST_NAME` in `./app.js` to your domain name.

# Document & Support

Full documentation is available at http://docs.waachplatformconnector.apiary.io/#

For questions and support, please [Email us](mailto:system@waach.com)
