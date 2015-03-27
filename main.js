'use strict';

if(process.env.NODE_ENV === 'development'){
  require('dotenv').load();  
}

var log = require('blikk-logjs')('app');
var app = require('./lib/app');

if(!process.env.KAFKA_REST_ENDPOINT){
  log.error('You must set the KAFKA_REST_ENDPOINT environment variable.');
  process.exit(1);
}

if(!process.env.CONTENT_CHANGE_TOPIC){
  log.error('You must set the CONTENT_CHANGE_TOPIC environment variable.');
  process.exit(1);
}

if(!process.env.CONTENT_CHANGE_CONSUMER_GROUP){
  log.error('You must set the CONTENT_CHANGE_CONSUMER_GROUP environment variable.');
  process.exit(1);
}

if(!process.env.TWITTER_CONSUMER_KEY){
  log.error('You must set the TWITTER_CONSUMER_KEY environment variable.');
  process.exit(1);
}

if(!process.env.TWITTER_CONSUMER_SECRET){
  log.error('You must set the TWITTER_CONSUMER_SECRET environment variable.');
  process.exit(1);
}

if(!process.env.TWITTER_ACCESS_TOKEN_KEY){
  log.error('You must set the TWITTER_ACCESS_TOKEN_KEY environment variable.');
  process.exit(1);
}

if(!process.env.TWITTER_ACCESS_TOKEN_SECRET){
  log.error('You must set the TWITTER_ACCESS_TOKEN_SECRET environment variable.');
  process.exit(1);
}

app.startAsync({
  KAFKA_REST_ENDPOINT: process.env.KAFKA_REST_ENDPOINT,
  CONTENT_CHANGE_TOPIC: process.env.CONTENT_CHANGE_TOPIC,
  CONTENT_CHANGE_CONSUMER_GROUP: process.env.CONTENT_CHANGE_CONSUMER_GROUP,
  TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY: process.env.TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET
});