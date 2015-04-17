'use strict';

var events = require('events');
var nock = require('nock');
var sinon = require('sinon');
var KafkaRest = require('kafka-rest');
var app = require('../lib/app');
var expect = require('chai').expect;
var Twitter = require('twitter');

var CONFLUENT_KAFKA_ENDPOINT = 'http://confluent.blikk.co';
var CONTENT_CHANGE_TOPIC = 'articles';
var CONTENT_CHANGE_CONSUMER_GROUP = 'test-articles-consumer-group';
var TWITTER_CONSUMER_KEY = '';
var TWITTER_CONSUMER_SECRET = '';
var TWITTER_ACCESS_TOKEN_KEY = '';
var TWITTER_ACCESS_TOKEN_SECRET = '';

describe('The app', function(){

  var sandbox = sinon.sandbox.create();
  afterEach(function(){
    sandbox.restore();
  });

  it('should post articles to the CMS', function(done){
    var testStream = new events.EventEmitter();

    nock('http://test.ingreenlight.com')
      .post('/api/v1/articles')
      .reply(200, function(uri, requestBody) {
        var parsedBody = JSON.parse(requestBody);
        expect(parsedBody.title).to.eql('Hello World');
        expect(parsedBody.url).to.eql('http://www.ingreenlight.com');
        expect(parsedBody.metatags).to.eql({title: 'Hello World'});
        expect(parsedBody.author).to.be.undefined;
        return parsedBody;
      }, {'Content-Type': 'application/json'});

    sandbox.stub(KafkaRest.prototype, 'consumer', function(){
      var consumerObj = {};
      consumerObj.join = function(options, cb){
        var streamObj = {};
        streamObj.subscribe = function(topic, options) { return testStream; };
        cb(null, streamObj);
      };
      return consumerObj;
    });

    sandbox.stub(Twitter.prototype, 'post', function(endpoint, object, callback){
      expect(object.status).to.eql('Hello World http://www.helloworld.com');
      done();
      callback(null, {id: 'aaa'}, {status: 'OK'});
    });

    app.startAsync({
      CONFLUENT_KAFKA_ENDPOINT: CONFLUENT_KAFKA_ENDPOINT,
      CONTENT_CHANGE_TOPIC: CONTENT_CHANGE_TOPIC,
      CONTENT_CHANGE_CONSUMER_GROUP: CONTENT_CHANGE_CONSUMER_GROUP,
      TWITTER_CONSUMER_KEY: TWITTER_CONSUMER_KEY,
      TWITTER_CONSUMER_SECRET: TWITTER_CONSUMER_SECRET,
      TWITTER_ACCESS_TOKEN_SECRET: TWITTER_ACCESS_TOKEN_SECRET,
      TWITTER_ACCESS_TOKEN_KEY: TWITTER_ACCESS_TOKEN_KEY
    }).then(function(){
      testStream.emit('read', [{ value: {
        event: 'ARTICLE_CREATED',
        data: JSON.stringify({newRecord: {title: 'Hello World', url: 'http://www.helloworld.com'}})
      }}]);
    });

  });

});

