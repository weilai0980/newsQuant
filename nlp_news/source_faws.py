#coding: utf8
#!/usr/bin/python3
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from pymongo import DESCENDING

import sys
import os
import time 
import urllib

import pprint
import datetime
import calendar

URL = 'https://faws.com/'
DEBUG = False

def unix_date_parser(weird_string):
    zoned_time = datetime.datetime.strptime(weird_string[:-6], "%Y-%m-%dT%H:%M:%S")
    # ugly string parcing for the dates
    # move forward or backwards in time
    shift = 1 if (weird_string[-6:-5] == '-') else -1
    d_hours = int(weird_string[-5:-3])
    d_mins = int(weird_string[-2:])

    non_zoned_time = zoned_time + datetime.timedelta(hours=shift*d_hours, minutes=shift*d_mins)
    unix_format_time = calendar.timegm(non_zoned_time.timetuple())
    return unix_format_time

def get_latest_news_timestamp(collection):
    last_timestamp = collection.find_one(sort=[("published", DESCENDING)])
    time_string = 0
    if (last_timestamp is not None):
        time_string = last_timestamp['published']
    return time_string

def write_mongo_entry(collection, entry):
    post_id = collection.insert_one(entry).inserted_id
    if (DEBUG):
        print("inserted:", post_id)

def process_page(collection, url=URL):
    current_timestamp = int(time.time())
    last_timestamp = get_latest_news_timestamp(collection)
    if (DEBUG):
        print("last_timestamp", last_timestamp)
    page = requests.get(url)
    contents = page.content
    # time-consuming part
    soup = BeautifulSoup(contents, 'html.parser') # html.parser
    samples = soup.find_all('li',  class_='')
    
    for li in samples:
        t = li.find('time')
        full_title = li.find('div', {'class': 'headline-title'})
        # this returns the short text descrritpion 
        short_text = li.find('div', {'class': 'collapse'})

        if ((short_text is not None)):
            pub_time = t.get('datetime')
            # weird timing conversion
            unix_t = unix_date_parser(pub_time)
            par = short_text.find('p').text.encode('utf-8').decode('utf-8', 'ignore')
            title = full_title.find('span').text.encode('utf-8').decode('utf-8', 'ignore')
            link = short_text.find('a').get('href').encode('utf-8').decode('utf-8', 'ignore')

            entry = { 'downloaded' : current_timestamp,
                        'sentiment' : 0,
                        'published' : unix_t,
                        'title' : title,
                        'raw_text' : par,
                        'url' : link,
                        'source' : 'forum',
                        'language' : 'en'
            }   
            if (DEBUG):
                print("unix_t", unix_t)
            if(last_timestamp < unix_t):
                write_mongo_entry(collection, entry)
        
if __name__ == "__main__":
    if (len(sys.argv) == 3):
        # get rid of the special characters
        username = urllib.parse.quote(sys.argv[1])
        password = urllib.parse.quote(sys.argv[2])

        client = MongoClient("mongodb://%s:%s@spaceml4.ethz.ch:27017/CDteam3DB" % (username, password))
        db = client['CDteam3DB']
        collection = db['milkyklim-faws'] # empty-test

        process_page(collection, URL)
        # get_latest_news_timestamp(collection)
    else:
        print('No username and password provided')
    print("DOGE!")