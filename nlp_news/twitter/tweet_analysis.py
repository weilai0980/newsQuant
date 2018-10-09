import nltk
import json
import spacy
import numpy as np

nlp = spacy.load('en_core_web_sm')
from nltk.sentiment.vader import SentimentIntensityAnalyzer as SIA

sia = SIA()

cg = {"id": [], "name": [], "symbol": []} # crypto glossary

with open("crypto_glossary.txt") as file:
    for i, line in enumerate(file):
        if i == 0 : continue
        if i == 50 : break
        words = line.split(',')
        cg["id"].append(words[0].strip())
        cg["name"].append(words[1].strip())
        cg["symbol"].append(words[2].strip())

def sentiment(tweet):
    score = np.argmax([sia.polarity_scores(tweet)["pos"], sia.polarity_scores(tweet)["neg"], sia.polarity_scores(tweet)["neu"]])
    if score == 0: return "pos"
    elif score == 1: return "neg"
    elif score == 2: return "neu"

def sentiment_comp(tweet):
    #sentiment_comp is more fine grained, and will detect partially positive and negative tweets as well.
    if sia.polarity_scores(tweet)["compound"]>0.2: return "pos"
    elif sia.polarity_scores(tweet)["compound"]<-0.2: return "neg"
    else : return "neu"

def sentiment_score(tweet):
    return sia.polarity_scores(tweet)["compound"]

def mentioned(tweet):
    for word in tweet.split(" "):
        if word[0]=="@": return word

def detect_keyws(tweet):
    # also deals with plurals
    detected = []
    for word in tweet.split(" "):
        process_stem = False
        word = word.strip(",.?!").strip()
        if len(word)==0:
            continue
        if word[-1] == "s":
            word_stem = word[:-1]
            process_stem = True
        if (word[0] == "#") | (word[0] == "@") | (word[0] == "$"):
            word_stem = word[1:]
            process_stem = True
        if (word in cg["id"]) | (word in cg["name"]) | (word in cg["symbol"]):
            detected.append(word.lower().strip())
        if process_stem:
            if (word_stem in cg["id"]) | (word_stem in cg["name"]) | (word_stem in cg["symbol"]):
                detected.append(word_stem.lower().strip())
    return list(set(detected))

