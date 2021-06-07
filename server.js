process.env.NO_PROXY = "localhost";

const SERVICES_ROOT = "http://www.ga.gov.au/explorer-web";

let config = require("./lib/config");
let isDev = config.isDev;

const express = require("express");
const bodyParser = require('body-parser');

const fs = require("fs");
const request = require('request');
let mappers = require("./lib/mapper-picker");

// For positioning. We need a token
const Token = require("./lib/token");
let token = new Token(Object.assign({ isDev }, config.fmeToken));

const Secrets = require("./lib/secrets");
let secrets = new Secrets(Object.assign({ isDev }, config.secrets));

request.gzip = false;

//var httpProxy = require('http-proxy');
let app = express();
//app.use(bodyParser.json({limit: '50mb'}));

app.use(function (req, res, next) {
    // service uses pipes and body parser reads the stream and closes it.
    if (req.url.indexOf("/service/") === 0) {
        return next();
    } else {
        bodyParser.json({ limit: '30mb' })(req, res, next);
    }
});


let url = require('url');
let X2JS = require('x2js');

// A bit ugly but we will get rid of it soon.
let TOUCHPATH = "/home/ec2-user/touched/touched";

let StringDecoder = require('string_decoder').StringDecoder;
let yargs = require('yargs').options({
    'port': {
        'default': 3000,
        'description': 'Port to listen on.'
    },
    'public': {
        'type': 'boolean',
        'description': 'Run a public server that listens on all interfaces.'
    },
    'upstream-proxy': {
        'description': 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".'
    },
    'bypass-upstream-proxy-hosts': {
        'description': 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"'
    },
    'help': {
        'alias': 'h',
        'type': 'boolean',
        'description': 'Show this help.'
    }
});
let argv = yargs.argv;
let port = process.env.PORT || argv.port;
let dontProxyHeaderRegex = /^(?:Host|Proxy-Connection|Accept-Encoding|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade)$/i;
// There should only ever be a couple. We do a contains on the requested host.
let validHosts = config.validHosts;
let upstreamProxy = argv['upstream-proxy'];

// eventually this mime type configuration will need to change
// https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
let mime = express.static.mime;
mime.define({
    'application/json': ['czml', 'json', 'geojson', 'topojson'],
    'model/vnd.gltf+json': ['gltf'],
    'model/vnd.gltf.binary': ['bgltf'],
    'text/plain': ['glsl']
});

// add timestamps in front of log messages
require('console-stamp')(console, { datePrefix: "", dateSuffix: "", label: false, pattern: '[yyyymmdd HHMMss.l]' });

// serve static files
app.use(express.static("dist"));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


(async () => {
    let privateKey = await secrets.recaptchaPrivateKey();
    let recaptcha = new (require("./lib/recaptcha"))(privateKey);
    let serviceBroker = new (require("./lib/serviceBroker"))(config.elevation, token);
    let elevationService = new (require("./lib/elevationservice"))(config.elevation.elevationTemplate, token);

    /*
     * Initiate jobs on FME server.
     *
     */
    app.post('/elevation/initiateJob', function (req, res, next) {
        let data = req.body;

        //console.log("initiate job: " + JSON.stringify(data, null, 3));

        recaptcha.verify(req.connection.remoteAddress, data.parameters.recaptcha, function (error, response, body) {
            if (error) {
                // There was an error trying to call the verification service.
                res.status(500).send({
                    status: 'error',
                    message: 'Failed to connect to the reCAPTCHA user verification server.'
                });
            } else {
                const bodyObj = JSON.parse(body);
                if (!bodyObj.success) {
                    // Verification failed. Invalid recaptcha token.
                    res.status(403).send({
                        status: 'error',
                        message: 'reCAPTCHA user verification failed: ' + recaptcha.getErrorMessage(bodyObj['error-codes'])
                    });
                } else {
                    // Request validated.
                    delete data.parameters.recaptcha;
                    serviceBroker.execute(data).then(message => {
                        res.status(200).send(message);
                    });
                }
            }
        });
    });

    app.get('/elevation', async (req, res) => {
        let { error, response, body } = await elevationService.get(req.query);
        let code = 500;

        if (response) {
            code = response.statusCode;
            res.header(filterHeaders(req, response.headers));
        }
        res.status(code).send(body);
    });

    app.all('/service/*', function (req, res, next) {
        var method, r;

        method = req.method.toLowerCase();

        console.log("URL: " + method + " " + SERVICES_ROOT + req.url);

        switch (method) {
            case "get":
                r = request.get({
                    uri: SERVICES_ROOT + req.url,
                    json: req.body
                });
                break;
            case "put":
                r = request.put({
                    uri: SERVICES_ROOT + req.url,
                    json: req.body
                });
                break;
            case "post":
                r = request.post({
                    uri: SERVICES_ROOT + req.url,
                    json: req.body
                });
                break;
            case "delete":
                r = request.del({
                    uri: SERVICES_ROOT + req.url,
                    json: req.body
                });
                break;
            default:
                return res.send("invalid method");
        }
        return req.pipe(r).pipe(res);
    });

    // This doesn't refresh Solr straight away. It simply touches a file and it is up to something else to react to the touch
    app.get('/touch', function (req, res) {
        fs.closeSync(fs.openSync(TOUCHPATH, 'w'));
        res.header({
            "Content-Type": "application/json;charset=UTF-8"
        });
        res.status(200).send({ status: "success" });
    });

    const REFERERS = { localhost: true, "elevation.": true };

    app.get('/wms/*', function (req, res, next) {
        console.log(req.headers.referer);
    });

    app.get('/xml2js/*', function (req, res, next) {
        // look for request like http://localhost:8080/proxy/http://example.com/file?query=1
        var remoteUrl = getRemoteUrlFromParam(req);
        if (!remoteUrl) {
            // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
            remoteUrl = Object.keys(req.query)[0];
            if (remoteUrl) {
                remoteUrl = url.parse(remoteUrl);
            }
        }

        if (!remoteUrl) {
            return res.status(400).send('No url specified.');
        }

        // We only want a very few requests to get through. Via the whitelist.
        var host = remoteUrl.host;
        if (!validHosts.some((valid) => {
            return host.indexOf(valid) > -1;
        })) {
            return res.status(403).send('Not a white listed host. Go away!');
        }

        if (!remoteUrl.protocol) {
            remoteUrl.protocol = 'http:';
        }

        var proxy;
        if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
            proxy = upstreamProxy;
        }

        // encoding : null means "body" passed to the callback will be raw bytes

        request.get({
            url: url.format(remoteUrl),
            headers: filterHeaders(req, req.headers),
            encoding: null,
            proxy: proxy
        }, function (error, response, body) {
            var code = 500;
            var x2js, text, headers, decoder = new StringDecoder('utf8');
            if (error) {
                console.log("Err", error);
            }
            if (body) {
                code = response.statusCode;
                headers = filterHeaders(req, response.headers);
                headers['Content-Type'] = 'application/json';
                res.header(headers);
                text = body.toString();
                x2js = new X2JS();
                res.status(code).send(x2js.xml2js(body.toString()));
            } else {
                console.log("No body!")
                res.status(code).send('{"error":{"code": ' + code + '}}');
            }
        });
    });


    app.get('/gazetteer/json', function (req, res, next) {
        console.log(JSON.stringify(req.params));
        let id = req.param("id");

        let mapper = mappers.findById(id);

        let url = mapper.createPath(id);


        request.get({
            url: url,
            headers: filterHeaders(req, req.headers),
            encoding: null
        }, function (error, response, body) {
            var code = response.statusCode;
            var x2js, text, headers, decoder = new StringDecoder('utf8');
            if (error) {
                console.log("Err", error);
            }
            if (code === 200) {
                headers = filterHeaders(req, response.headers);
                headers['Content-Type'] = 'application/json';
                res.header(headers);
                text = body.toString();
                x2js = new X2JS();
                res.status(code).send(mapper.transform(x2js.xml2js(text)));
            } else {
                console.log("No body!")
                res.status(code).send('{"error":{"code": ' + code + '}}');
            }
        });
    });


    app.get('/gazetteer/wfs', function (req, res, next) {
        let id = req.param("id");
        let mapper = mappers.findById(id);

        let url = mapper.createPath(id);


        request.get({
            url: url,
            headers: filterHeaders(req, req.headers),
            encoding: null
        }, function (error, response, body) {
            var code = 500;
            var text, headers, decoder = new StringDecoder('utf8');
            if (error) {
                console.log("Err", error);
            }
            if (body) {
                code = response.statusCode;
                headers = filterHeaders(req, response.headers);
                headers['Content-Type'] = 'application/xml';
                res.header(headers);
                text = body.toString();
                res.status(code).send(text);
            } else {
                console.log("No body!")
                res.status(code).send('{"error":{"code": ' + code + '}}');
            }
        });
    });

    // This works on my local machine for development as I have a Solr instance on a Linux box
    // but it is to be expected that it will not be hit in production so doesn't need changing
    // as proxying via the apache proxy will intercept and route the request to the local Solr instance.
    app.get('/select', function (req, res, next) {
        var remoteUrl = req.url;
        // let wholeUrl = "http://web.geospeedster.com" +  remoteUrl;
        // let wholeUrl = "http://192.168.0.24:8983/solr/placenames" + remoteUrl;
        let wholeUrl = "http://placenames.fsdf.org.au" + remoteUrl;
        console.log(wholeUrl);


        request.get({
            url: wholeUrl,
            headers: filterHeaders(req, req.headers),
            encoding: null
        }, function (error, response, body) {
            var code = 500;

            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }

            res.status(code).send(body);
        });
    });

    app.get('/proxy/*', function (req, res, next) {
        // look for request like http://localhost:8080/proxy/http://example.com/file?query=1

        var remoteUrl = getRemoteUrlFromParam(req);
        if (!remoteUrl) {
            // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
            remoteUrl = Object.keys(req.query)[0];
            if (remoteUrl) {
                remoteUrl = url.parse(remoteUrl);
            }
        }

        if (!remoteUrl) {
            return res.status(400).send('No url specified.');
        }

        // We only want a very few requests to get through. Via the whitelist.
        var host = remoteUrl.host;
        if (!validHosts.some((valid) => {
            return host && host.indexOf(valid) > -1;
        })) {
            return res.status(403).send('Not a white listed host. Go away!');
        }

        if (!remoteUrl.protocol) {
            remoteUrl.protocol = 'http:';
        }

        var proxy;
        if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
            proxy = upstreamProxy;
        }

        // encoding : null means "body" passed to the callback will be raw bytes

        request.get({
            url: url.format(remoteUrl),
            headers: filterHeaders(req, req.headers),
            encoding: null,
            proxy: proxy
        }, function (error, response, body) {
            var code = 500;

            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }

            res.status(code).send(body);
        });
    });

    app.post('/positioning/upload', async (req, res, next) => {
        let tokenStr = await token.getToken();
        let fme = request.post({
            uri: config.positioning.uploadUrl,
            headers: {
                "Content-Type": req.header("Content-Type"),
                "Content-Length": req.header("Content-Length"),
                "Authorization": "fmetoken token=" + tokenStr
            }
        });

        req.pipe(fme).on('end', (uploadInfo) => {
            console.log("Upload done");
            request.post({
                url: config.positioning.transformUrl,
                headers: {
                    'Authorization': "fmetoken token=" + tokenStr
                },
                json: req.query
            }, function (error, response, body) {
                var code = 500;
                if (response) {
                    code = response.statusCode;
                    res.header(filterHeaders(req, response.headers));
                }
                res.status(code).send(body);
            });
        });
    });

    app.post('/placenames/download', async (req, res) => {
        console.log("Getting token");
        let tokenStr = await token.getToken();
        console.log("Token received");
        request.post({
            uri: config.placenames.downloadUrl,
            headers: {
                "Content-Type": req.header("Content-Type"),
                "Authorization": "fmetoken token=" + tokenStr
            },
            json:req.body
        }, function (error, response, body) {
            var code = 500;
            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }
            res.status(code).send(body);
        });

        // We can't just pipe it because the body parser has already read the stream. We would have used...
        // req.pipe(fme).pipe(res);
    });

    app.listen(port, function (err) {
        console.log("running server on port " + port);
    });

})();

function getRemoteUrlFromParam(req) {
    var remoteUrl = req.params[0];
    if (remoteUrl) {
        // add http:// to the URL if no protocol is present
        if (!/^https?:\/\//.test(remoteUrl)) {
            // Now double slashes are removed on some URL's by some servers (which is the right behaviour)
            if (!/^https?:\//.test(remoteUrl)) {
                remoteUrl = 'http://' + remoteUrl;
            } else {
                remoteUrl = remoteUrl.replace(":/", "://");
            }
        }
        remoteUrl = url.parse(remoteUrl);
        // copy query string
        remoteUrl.search = url.parse(req.url).search;
    }
    return remoteUrl;
}

function filterHeaders(req, headers) {
    var result = {};
    // filter out headers that are listed in the regex above
    Object.keys(headers).forEach(function (name) {
        if (!dontProxyHeaderRegex.test(name)) {
            result[name] = headers[name];
        }
    });
    return result;
}
