'use strict';

/**
 * @overview backup
 *
 * @description
 * This file contains a collection of tools to automate backups of the BHIMA
 * database.
 */

var s3 = require('s3-client');
var debug = require('debug')('backups');
var tmp = require('tempy');
var util = require('./util');
var lzma = require('lzma-native');
var streamToPromise = require('stream-to-promise');
var fs = require('fs');
var moment = require('moment');
var q = require('q');

var client = s3.createClient({
  s3Options: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  }
});

/**
 * @method backup
 *
 * @description
 * This function runs all the backup functions in order from dump to upload.  It
 * should probably be tested live in production to see if this is actually
 * something we want to do before calling it all the time.
 */
function backup(filename) {
  var file = filename || tmp.file({ extension: '.sql' });

  debug('#backup() beginning backup routine.');

  return mysqldump(file).then(function () {
    return xz(file);
  }).then(upload);
}

/**
 * @function mysqldump
 *
 * @description
 * This function runs mysqldump on the database with provided options.  There is
 * a switch to allow the user to dump the schema as necessary.
 */
function mysqldump(file) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var cmd = 'mysqldump %s > ' + file;

  debug('#mysqldump() dumping database ' + (options.includeSchema ? 'with' : 'without') + ' schema.');

  // this is an array to make it easy to add or remove options
  var flags = ['--user=' + process.env.DB_USER, '-p' + process.env.DB_PASS, '--databases ' + process.env.DB_NAME,

  // compress information between the client and server in case we are on a
  // networked database.
  '--compress',

  // wrap everything in a START TRANSACTION and COMMIT at the end.
  '--single-transaction',

  // preserve UTF-8 names in the database dump.  These can be removed manually
  // if we need to remove it.
  '--set-charset',

  // make sure binary data is dumped out as hexadecimal.
  '--hex-blob',

  // retrieve rows one row at a time instead of buffering the entire table in memory
  '--quick',

  // do not pollute the dump with comments
  '--skip-comments',

  // show every column name in the INSERT statements.  This helps with later
  // database migrations.
  '--complete-insert',

  // speed up the dump and rebuild of the database.
  '--disable-keys',

  // building the dump twice should produce no side-effects.
  '--add-drop-database', '--add-drop-table'];

  // do not dump schemas by default.  If we want create info, we can turn it on.
  if (!options.includeSchema) {
    flags.push('--no-create-info');
  }

  if (options.includeSchema) {
    flags.push('--routines');
  }

  var program = util.format(cmd, flags.join(' '));
  return util.execp(program);
}

/**
 * @function xz
 *
 * @description
 * This function uses the lzma-native library for ultra-fast compression of the
 * backup file.  Since streams are used, the memory requirements should stay
 * relatively low.
 */
function xz(file) {
  var outfile = file + '.xz';

  debug('#xz() compressing ' + file + ' into ' + outfile + '.');

  var compressor = lzma.createCompressor();
  var input = fs.createReadStream(file);
  var output = fs.createWriteStream(outfile);

  var beforeSizeInMegabytes = void 0;
  var afterSizeInMegabytes = void 0;

  return util.statp(file).then(function (stats) {
    beforeSizeInMegabytes = stats.size / 1000000.0;
    debug('#xz() ' + file + ' is ' + beforeSizeInMegabytes + 'MB');

    // start the compresion
    var streams = input.pipe(compressor).pipe(output);
    return streamToPromise(streams);
  }).then(function () {
    return util.statp(outfile);
  }).then(function (stats) {
    afterSizeInMegabytes = stats.size / 1000000.0;
    debug('#xz() ' + outfile + ' is ' + afterSizeInMegabytes + 'MB');

    var ratio = Number(beforeSizeInMegabytes / afterSizeInMegabytes).toFixed(2);

    debug('#xz() compression ratio: ' + ratio);

    return outfile;
  });
}

/**
 * @method upload
 *
 * @description
 * This function uploads a file to Amazon S3 storage.
 */
function upload(file) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  debug('#upload() uploading backup file ' + file + ' to Amazon S3.');

  if (!options.name) {
    options.name = process.env.DB_NAME + '-' + moment().format('YYYY-MM-DD') + '.sql.xz';
  }

  var params = {
    localFile: file,
    s3Params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: options.name
    }
  };

  var deferred = q.defer();

  var uploader = client.uploadFile(params);

  uploader.on('error', deferred.reject);
  uploader.on('end', deferred.resolve);

  return deferred.promise.then(function (tags) {
    debug('#upload() upload completed. Resource ETag: ' + tags.ETag);
  });
}

exports.backup = backup;
exports.mysqldump = mysqldump;
exports.upload = upload;
exports.xz = xz;