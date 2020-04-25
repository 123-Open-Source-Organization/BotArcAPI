// filename : corefunc/arcfetch.js
// author   : TheSnowfield
// date     : 04/12/2020
// comment  : all arcapi requests will goes here
'use strict'

const TAG = 'corefunc/arcfetch.js';

const btoa = require('abab').btoa;
const fetch = require('node-fetch');
const Request = fetch.Request;
const APIError = require('./error');

class ArcAPIRequest extends Request {
  constructor(method, resturl, init) {
    if (method != 'GET' && method != 'POST')
      throw new TypeError('request method only be GET and POST');
    if (!resturl)
      throw new TypeError('resturl cannot be null');
    if (!init)
      throw new TypeError('init cannot be null');

    // request url
    const _request_url = `https://arcapi.lowiro.com/${ARCAPI_VERSION}/${resturl}`;

    // standard http headers
    const _request_headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'AppVersion': ARCAPI_APPVERSION,
      'User-Agent': ARCAPI_USERAGENT,
      'Host': 'arcapi.lowiro.com',
      'Connection': 'Keep-Alive'
    }

    // extra identity header
    if (init.usertoken) {
      _request_headers['Accept-Encoding'] = 'identity';
      _request_headers['Authorization'] = `Bearer ${init.usertoken}`;
    }
    else if (init.username && init.userpwd) {
      _request_headers['Accept-Encoding'] = 'identity';
      _request_headers['Authorization'] = `Basic ${btoa(`${init.username}:${init.userpwd}`)}`;
    }

    // extra device header
    if (init.deviceid) {
      _request_headers['DeviceId'] = init.deviceid;
    }

    // for POST forms
    if (init.postdata && method == 'GET')
      throw new TypeError('GET method not supported post data');
    const _request_body = init.postdata;

    super(_request_url, {
      method: method,
      headers: _request_headers,
      body: _request_body
    });
  }
}

function arcfetch(request) {
  syslog.v(TAG, `Arcfetch => ${request.url}`);

  return new Promise(async (resolve, reject) => {

    // request origin arcapi
    return await fetch(request)
      .then((response) => {
        return response.text();
      })

      // try parse json
      // print rawdata when failing
      .then((rawdata) => {
        try {
          return JSON.parse(rawdata);
        } catch (e) {
          syslog.e(TAG, rawdata);
          return reject(new APIError(-1, `Arcapi currently unavailable`));
        }
      })

      // ensure it's a json
      .then((root) => {
        if (root.success)
          return resolve(root);
        else {
          syslog.e(TAG, JSON.stringify(root));
          return reject(new APIError(root.error_code, 'Arcapi returns an error'
          ));
        }
      })

      // any errors
      .catch((e) => {
        return reject(e);
      });
  });
}

/**
 * fetch wrapper for arcapis
 * @param {ArcAPIRequest} request
 */
const arcfetch_retry = async (request) => {

  let _retry = 0;
  while (true) {

    try {
      return await arcfetch(request);
    }
    catch (e) {
      _retry += 1;
      syslog.e(TAG, e.stack);
      syslog.w(TAG, `Failed... retrying ${_retry}/${ARCAPI_RETRY}`);

      if (_retry > ARCAPI_RETRY) throw e;
    }
  }
}

// exports
module.exports = exports = arcfetch_retry;
exports.default = exports;
exports.ArcAPIRequest = ArcAPIRequest;
