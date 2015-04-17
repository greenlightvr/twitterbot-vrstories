'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var log = require('blikk-logjs')('app');
var KafkaRest = require('kafka-rest');
var Twitter = require('twitter');
var moment = require('moment');

var App = function(){};

App.prototype.start = function(options, callback) {
  log.info({options: options}, 'starting app');

  var app = this;

  this.requestDelay = 1000 * 60;
  this.kafkaRestEndpoint = options.KAFKA_REST_ENDPOINT;

  // Topic we're listening to
  this.contentChangeTopic = options.CONTENT_CHANGE_TOPIC;
  this.contentChangeConsumerGroup = options.CONTENT_CHANGE_CONSUMER_GROUP;
  
  // Twitter
  this.twitter = new Twitter({
    consumer_key: options.TWITTER_CONSUMER_KEY,
    consumer_secret: options.TWITTER_CONSUMER_SECRET,
    access_token_key: options.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: options.TWITTER_ACCESS_TOKEN_SECRET
  });
  
  this.kafka = new KafkaRest({url: this.kafkaRestEndpoint});
    
  app.initStream(callback);
};

App.prototype.initStream = function(callback){
  var app = this;

  var consumerOptions = _.pick({
    format: 'avro',
    'auto.commit.enable': true
  }, _.identity);

  Promise.fromNode(function(cb){
     app.kafka.consumer(app.contentChangeConsumerGroup).join(consumerOptions, cb);
  }).then(function(consumer){
    app.stream = consumer.subscribe(app.contentChangeTopic, { requestDelay: app.requestDelay });
    app.stream.on('read', function(msgs){
      _.forEach(_.pluck(msgs, 'value'), app.processRecord.bind(app));
    });
    app.stream.on('err', function(err){
      log.error({err: err});
    });
    log.info({topic: app.contentChangeTopic}, 'subscribed to topic');
    callback(null, app.stream);
  }).catch(function(err){
    log.error({err: err}, 'failed to create streaming consumer');
    callback(err, null);
  });
};

App.prototype.generateTweetStatus = function(article){
  article.metatags = article.metatags || {};
  var text = article.metatags['twitter:title'] || article.title;
  var url = article.metatags['twitter:url'] || article.url;
  // We assume the url is being wrapped in a 20 character t.co link, plus a space
  // 140-20-1
  text = text.substr(0,119);
  var status = text + ' ' + url;
  return status;
};

App.prototype.processRecord = function(record){
  var app = this;
  if(record.event !== 'ARTICLE_ADDED') {
    return;
  }
  var article = JSON.parse(record.data).newRecord;
  // We only consider articles with either unknown dates or recent dates
  var articleDate = moment(article.date || null);
  if (articleDate.isBefore(moment().subtract(7, 'days'))){
    return;
  }
  var status = app.generateTweetStatus(article);
  Promise.fromNode(function(cb){
    app.twitter.post('statuses/update', {status: status}, cb);
  }).spread(function(tweet, respone){
    log.info({status: status, tweet: tweet}, 'posted status on twitter');
  }).catch(function(err){
    log.error({err: err, status: status}, 'failed to post status on twitter');
  });
};


Promise.promisifyAll(App);
Promise.promisifyAll(App.prototype);

module.exports = new App();