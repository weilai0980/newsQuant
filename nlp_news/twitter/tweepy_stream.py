import sys
#sys.path.append("/home/ubuntu/anaconda2/envs/ds3/lib/python3.6/site-packages/")
import traceback
import utils
import json
from pymongo import MongoClient
import urllib
from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream
from tweet_analysis import sentiment, sentiment_comp, sentiment_score, detect_keyws

conf = utils.get_config("./config/test_config.ini")

def credentials(i):

    access_token = conf["Credentials"+str(i)]["access_token"]
    access_token_secret = conf["Credentials"+str(i)]["access_token_secret"]
    consumer_key = conf["Credentials"+str(i)]["consumer_key"]
    consumer_secret = conf["Credentials"+str(i)]["consumer_secret"]
    raw_pass = conf["Credentials"+str(i)]["raw_pass"]

    return access_token,access_token_secret,consumer_key,consumer_secret,raw_pass


class StdOutListener(StreamListener):

    def on_data(self, data):

        data = json.loads(data)
        
        print()

        # Get the full text of a tweet
        if "retweeted_status" in data:
            if "extended_tweet" in data["retweeted_status"]:
                tweet = data["retweeted_status"]["extended_tweet"]["full_text"]
            else:
                tweet = data["retweeted_status"]["text"]
        else:
            if "extended_tweet" in data:
                tweet = data["extended_tweet"]["full_text"]
            else:
                tweet = data["text"]

        #print(repr(tweet))
        #print("sentiment -> "+str(sentiment(tweet)))
        #print("sentiment_comp -> "+str(sentiment_comp(tweet)))
        #print("sentiment_score -> "+str(sentiment_score(tweet)))
        #print("keywords -> "+str(detect_keyws(tweet)))
        #print(json.dumps(data,indent=4))

        data["sentiment"] = sentiment(tweet)
        data["sentiment_comp"] = sentiment_comp(tweet)
        data["sentiment_score"] = sentiment_score(tweet)
        
        # coins mentioned in tweet
        data["coins"] = detect_keyws(tweet)
        data["timestamp_ms"] = int(data["timestamp_ms"])
        
        # write to DB
        #tweets.insert_one(data)
        
        print(data) 
        
        return True


    def on_error(self, status):
        print (status)
        

if __name__ == '__main__':

    i=1
    while True:
        
        print("Requesting Twitter API with Credentials"+str(i))
        access_token, access_token_secret, consumer_key, consumer_secret, raw_pass = credentials(i)

        #url = "mongodb://CDteam1:" + urllib.parse.quote_plus(raw_pass) + "@spaceml4.ethz.ch:27017/CDteam1DB"
        #client = MongoClient(url)
        #db = client.CDteam1DB
        #tweets = db.tweets
        
        try:
            access_token, access_token_secret, consumer_key, consumer_secret, raw_pass = credentials(i)
            
            
            auth = OAuthHandler(consumer_key, consumer_secret)
            auth.set_access_token(access_token, access_token_secret)
            
            stream = Stream(auth, StdOutListener(), tweet_mode="extended")
            keywords = conf["Parameters"]["keywords"].split(',\n')
            
            stream.filter(languages=["en"], track=keywords)
            

        except KeyboardInterrupt:
                print("Shutting down!!")
                raise

        except Exception as ex:
            if i == 1: i = 2
            else: i = 1
            traceback.print_exc(file=sys.stdout)
