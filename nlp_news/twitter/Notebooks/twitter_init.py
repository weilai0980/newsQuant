# Import the necessary methods from tweepy library
from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream

# Variables that contains the user credentials to access Twitter API 
access_token = "747486639606272000-YbDA6E8yyGVHCfaN7JaVFo7ioRlp4SQ"
access_token_secret = "Xg3pxHOfDkfp1pS9QHvlygU1dOkwLsPa6gbcdhPqh4b5m"
consumer_key = "WKCoXqK7KetVxVwDOLz13QCUe"
consumer_secret = "80U7w000HwEIjoJXT0JmZffW3LoN6ps8CgVWLYEq0KPmtHdL5Z"


# This is a basic listener that just prints received tweets to stdout.
class StdOutListener(StreamListener):

    def on_data(self, data):
        print (data)
        return True

    def on_error(self, status):
        print (status)


if __name__ == '__main__':
    frame = []
    # This handles Twitter authetification and the connection to Twitter Streaming API
    l = StdOutListener()
    auth = OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_token_secret)
    stream = Stream(auth, l)
    # This line filter Twitter Streams to capture data by the keywords: 'python', 'javascript', 'ruby'
    stream.filter(track=["bitcoin"])
