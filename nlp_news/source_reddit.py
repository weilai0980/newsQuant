import feedparser
import pymongo
from pymongo import MongoClient


mongoClient = MongoClient('spaceml4.ethz.ch', 27017, username="CDteam3", password="sdqy<5q9UW6JDhV", authSource="CDteam3DB")
db = mongoClient["CDteam3DB"]

collection = db["rssfeed"]

rssfeedlist = ['https://www.reddit.com/r/CryptoCurrency.rss','https://www.reddit.com/r/Bitcoin.rss','https://www.reddit.com/r/ethereum.rss','https://www.reddit.com/r/Ripple.rss','https://www.reddit.com/r/Bitcoincash.rss','https://www.reddit.com/r/litecoin.rss','https://www.reddit.com/r/cardano.rss','https://www.reddit.com/r/NEO.rss','https://www.reddit.com/r/Stellar.rss','https://www.reddit.com/r/eos.rss','https://www.reddit.com/r/Iota.rss']

def get_articles(parsed):
    articles = []
    entries = parsed['entries']
    for entry in entries:
        articles.append({
            'url': entry['link'],
            'title': entry['title'],
            'text': entry['description'],
            'pub_time': entry['updated'],
        })
    return articles

for f in rssfeedlist:
    parsed = feedparser.parse(f)
    x = get_articles(parsed)
    collection.insert_many(x)
