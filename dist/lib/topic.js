'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint class-methods-use-this:off */
/**
 * @overview
 * This library is responsible for constructing and exposing the Topic class
 * to server methods.  Since NodeJS modules are singletons, there will only ever
 * exist a single Topic instance that all modules can subscribe to.
 *
 * The Topic class is a simple event emitter that capture event emissions,
 * attaches a timestamp and defers the callback for performance reasons.
 *
 * The Topic is also responsible for writing event logs to the database.
 *
 * @todo refine the ideas of channels, events, and entities to something that
 * can be easily localized and used.
 *
 * @requires lodash
 * @requires ioredis
 * @requires debug
 * @requires db
 */

var _ = require('lodash');
var Redis = require('ioredis');
var debug = require('debug')('app:topic');
// const db = require('./db');

var hasEventsEnabled = process.env.ENABLE_EVENTS === 'true';
if (!hasEventsEnabled) {
  debug('publish and subscribe are disabled.  Enabled by setting ENABLE_EVENTS to true.');
} else {
  debug('publish and subscribe are enabled.  Disable by setting ENABLE_EVENTS to true.');
}

var hasEventsLogEnabled = hasEventsEnabled && process.env.ENABLE_EVENTS_LOG === 'true';

// event constants
var events = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  REPORT: 'report',
  LOGIN: 'login',
  RELOAD: 'reload',
  LOGOUT: 'logout',
  SEARCH: 'search'
};

// event entities
var entities = {
  PATIENT: 'patient',
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  VOUCHER: 'voucher',
  PATIENT_GROUP: 'patient group',
  DEBTOR_GROUP: 'debtor_group',
  EMPLOYEE: 'employee',
  USER: 'user',
  SERVICE: 'service',
  SUPPLIER: 'supplier',
  PERMISSION: 'permission',
  LOCATION: 'location',
  CASHBOX: 'cashbox'
};

// event channels
var channels = {
  ALL: 'all',
  APP: 'app',
  MEDICAL: 'medical',
  FINANCE: 'finance',
  INVENTORY: 'inventory',
  ADMIN: 'administration'
};

// writes events into the event database table
function databaseLogger(data) {
  if (!hasEventsLogEnabled) {
    return;
  }

  if (!data.entity) {
    throw new Error('[topic] The event ' + data.event + ' expected an entity, but got ' + data.entity + ' instead.');
  }

  var record = {
    timestamp: new Date(data.timestamp),
    user_id: data.user_id,
    channel: data.channel,
    entity: data.entity,
    type: data.event,
    data: JSON.stringify(data)
  };

  // this is cheeky substitution, but works.  Eventually we can standardize this using lodash
  // template strings
  //
  debug('[' + record.channel + '] ' + (data.user || record.user_id) + ' ' + record.type + 'ed a ' + record.entity + '.');

  /*
   * @todo - in a week of operation on a small scale ~600 events were
   * written.  We are turning this off until we get a better idea of how
   * to scale this.
  db.exec('INSERT INTO event SET ?', [record])
    .catch(err => winston.error(err))
    .done();
  */
}

/**
 * @function serialize
 *
 * @description serializes an object using JSON.stringify()
 *
 * @param {Object} data  an object of data to serialize
 * @returns {String} data  a string representation of the original data that can
 *    be passed to Redis
 */
function serialize(data) {
  return JSON.stringify(data);
}

/**
 * @function serialize
 *
 * @description serializes an object using JSON.stringify()
 *
 * @param {Object} data  an object of data to serialize
 * @returns {String} data  a string representation of the original data that can
 *    be passed to Redis
 */
function deserialize(data) {
  return JSON.parse(data);
}

/**
 * @class Topic
 *
 * @description
 * An event emitter designed to broadcast events throughout and between app
 * instances of the bhima server.  Redis is used to implement a
 * publish/subscribe pattern, publishing events along channels and registering
 * listeners to be called when specific channels are published upon.  Due to the
 * design of ioredis, separate Redis clients are used for publishing and
 * subscribing to messages.
 *
 * @example
 * const Topic = require('lib/Topic');
 *
 * // set up a listener on the MEDICAL channel
 * Topic.subscribe(Topic.channels.MEDICAL, (data) => {
 *   console.log('The MEDICAL channel received ${data}');
 * });
 *
 * // subscribe to every event by listening on the ALL channel
 * Topic.subscribe(Topic.channels.ALL, (data) => {
 *   console.log('This will fire on every event published.);
 * });
 *
 * Topic.publish(Topic.channels.MEDICAL, { message : 'hi' });
 * // console: 'The MEDICAL channel received { message : "hi" }'
 * // console: 'This will fire on every event published.'
 *
 * Topic.unsubscribe(Topic.channels.ALL);
 */

var Topic = function () {
  /**
   * @constructor
   *
   * @description
   * Creates two Redis instances, one for sending and the other for receiving.
   * Sets up a global listener on the 'all' channel that logs all events into
   * the database for future
   */
  function Topic() {
    _classCallCheck(this, Topic);

    this.disabled = !hasEventsEnabled;

    // perform no configuration if events are disabled
    if (this.disabled) {
      return;
    }

    // create a redis client for pub/sub messaging
    this.publisher = new Redis();
    this.subscriber = new Redis();

    // register the database logger
    this.subscribe(channels.ALL, databaseLogger);
  }

  /**
   * @method publish
   *
   * @description
   * Serializes and publishes data along the provided channel using the
   * publisher Redis client.
   *
   * @param {String} channel  the channel identifier to publish data on
   * @param {Object} data  data to send to all subscribers
   */


  _createClass(Topic, [{
    key: 'publish',
    value: function publish(channel, data) {
      if (this.disabled) {
        return;
      }

      var timestamp = Date.now();
      _.extend(data, { timestamp: timestamp, channel: channel });
      var serial = serialize(data);

      // skip if broadcasting on the ALL channel (we do this by default anyway)
      if (channel !== channels.ALL) {
        this.publisher.publish(channels.ALL, serial);
      }

      // broadcast on the ALL channel for global listeners
      this.publisher.publish(channel, serial);
    }

    /**
     * @method subscriber
     *
     * @description
     * Register a listener for data along the provided channel using the
     * subscriber Redis client.  Data is deserialized before being handed back to
     * the listener.
     *
     * @param {String} channel  the channel identifier to listen on
     * @param {Function} callback  a function to call with the data when events
     *   are emitted
     */

  }, {
    key: 'subscribe',
    value: function subscribe(channel, callback) {
      if (this.disabled) {
        return;
      }

      this.subscriber.subscribe(channel, function (err, count) {
        debug('Subscription count on channel [' + channel + '] is now [' + count + '].');
      });

      // open a subscription to the channel
      var subscription = function subscription(chnl, data) {
        return chnl === channel && callback(deserialize(data));
      };

      this.subscriber.on('message', subscription);
    }

    /**
     * @method unsubscribe
     *
     * @description
     * Unregisters listeners from a given channel.
     *
     * @param {String} channel - the channel to unsubscribe from.
     */

  }, {
    key: 'unsubscribe',
    value: function unsubscribe(channel, subscription) {
      if (this.disabled) {
        return;
      }

      debug('Unsubscribing a listener from ' + channel + '.');

      this.subscriber.unsubscribe(channel);
      this.subscriber.removeListener('message', subscription);
    }

    /* possible channels to subscribe to using the subscribe() method */

  }, {
    key: 'channels',
    get: function get() {
      return channels;
    }

    /* event constants for emitters to consume (defined above) */

  }, {
    key: 'events',
    get: function get() {
      return events;
    }

    /* entities that could be affected by the events */

  }, {
    key: 'entities',
    get: function get() {
      return entities;
    }
  }]);

  return Topic;
}();

/* export a singleton Event Emitter */


module.exports = new Topic();