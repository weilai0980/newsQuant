#!/usr/bin/env python
# -*- coding: utf-8 -*-

import feedparser
import pickle

import newspaper
from newspaper import Article
from time import mktime
from datetime import datetime

import calendar

from apscheduler.schedulers.blocking import BlockingScheduler

import time
import lxml.etree as ET

import sys
import os

import pymongo
from pymongo import MongoClient

# ---- parameters ---

para_log_file = "./log_file.txt"
para_time_interval = 15

para_collection_name = ['news_all',
                        'news_crypto']
para_rss = ['http://emm.newsbrief.eu/rss/rss?type=rtn&language=en&duplicates=false',
            'http://emm.newsbrief.eu/rss/rss?language=en&type=search&mode=advanced&atLeast=blockchain%2C+altcoin%2C+cryptocurrency%2C+token%2C+bitcoin%2C+ethereum%2C+litecoin%2C+cardano%2C+monero%2C+iota%2C+tether']

# ----

def load_news_content(link):
    
    try:
        tmp_content = Article(link)
        tmp_content.download()
        tmp_content.parse()
        
        # keywords, text
        tmp_text = tmp_content.text
        
        return tmp_text
    
    except Exception as e:
        # If the download for some reason fails (ex. 404) the script will continue downloading the next article.
        print(e)
        print("continuing...")
        
        with open(para_log_file, "a") as text_file:
            text_file.write(" ! Problematic page, no text extracted, continuing... : %s \n"%(str(link))) 
        
        return None
    
    
def db_ini( collection_name ):
    
    # Create the connection to MongoDB
    
    mongoClient = MongoClient('spaceml4.ethz.ch', 27017, username = 'CDteam1', password = 'sdqy<5q9UW6JDhV', authSource = 'CDteam1DB')
    db = mongoClient['CDteam1DB']
        
    return db[collection_name]
    
'''    
def db_insert_one(collection, new_item):
    
    try:
        collection.insertOne(new_item)
    except:
        print ("\n [Error] Unable to add article into the collection! \n")
        return
    
    print ("One piece of news saved!")
    
def db_insert_many(collection, new_items):
    
    try:
        collection.insertMany(new_items)
    except:
        print ("\n Error: Unable to add articles into the collection! \n")
        return
    
    print ("news in RSS update saved!")
    
'''

def rss_collecting_job_entity(rss, mode, collection_name):
    
    st_time = time.time()
    
    rss_emm = rss
    feed = feedparser.parse( rss_emm )

    entries = feed["entries"]
    
    # status information
    current_day = pickle.load(open("./current_day.p", "rb"))  
    current_news_set = pickle.load(open("./news_set.p", "rb"))
    
    # --- initialize data storage
    if mode == 'local':
        local_content = pickle.load(open("./local_content.p", "rb"))
        
    elif mode == 'db':
        print('\n ----- DB mode \n')
        #db_collection = db_ini(collection_name)
        
    else:
        print('\n ----- [ERROR] mode \n')
    
    # --- read RSS update
    
    date = feed['headers']['Date']
    date_split = date.split(' ')
    day = date_split[1]
    
    entries = feed["entries"]
    
    # RSS feeds for a new day
    if day != current_day:
        
        print('\n ----- read RSS for a new day: ', day)
        
        with open(para_log_file, "a") as text_file:
            text_file.write("\n ----- read RSS for a new day: %s \n"%(day)) 
        
        # update the log variables
        current_day = day
        current_news_set.clear()
    
    else:
        
        print('\n -- Start: current day -', current_day, 'amount of news by today -', len(current_news_set))
        
        with open(para_log_file, "a") as text_file:
            text_file.write("\n -- Start to read update in RSS: \n") 
    
    print('Amount in the current RSS feeds:', len(entries))
    
    
    # namespace
    ns = {'emm':"http://emm.jrc.it"}
    
    # recover=True
    parser = ET.XMLParser()
    XMLWiki = ET.parse(rss, parser)
    root = XMLWiki.getroot()

    news_to_db = []
    tmpcnt = 0

    for item in root.findall('.//item'):
        
        if tmpcnt%100 == 0:
            print('updating process... : ', tmpcnt)
            
            with open(para_log_file, "a") as text_file:
                text_file.write("updating process... : %d \n"%(tmpcnt))
                
        entry = entries[tmpcnt]     
        tmp_title = entry['title']
        
        tmp_content = load_news_content(entry['link'])
        
        # a new piece of news
        if tmp_title not in current_news_set and tmp_content:
            
            print('-- processing title : ', tmpcnt, tmp_title)
            
            current_news_set.add(tmp_title) 
            
            # tmp_tuple: title, time, link, full text, entity list, iso-language, category
            tmp_tuple = {}
            
            tmp_tuple.update({'title': tmp_title})
            
            # time converted to GMT-0 time, Coordinated Universal Time (UTC)
            tmp_tuple.update({'time': entry['published_parsed']})
            tmp_tuple.update({'timestep': calendar.timegm(entry['published_parsed'])})
            
            tmp_tuple.update({'link': entry['link']})
            tmp_tuple.update({'text': tmp_content})
            tmp_tuple.update({'language': entry['iso_language']})
            
            # name entity 
            tmp_entities = []
            
            # inherant entities
            for x in item.findall('.//emm:entity', namespaces=ns):
                # [entity id, name]
                tmp_entities.append([x.attrib['id'], x.attrib['name']])
                
            tmp_tuple.update({'entity': tmp_entities})
            
            # category 
            tmp_category = []
            for x in item.findall('.//category', namespaces=ns):
                tmp_category.append(x.text)
                
            tmp_tuple.update({'category': tmp_category})
            
            # collect the current tuple
            if mode == 'local':
                local_content.append(tmp_tuple)
            
            elif mode == 'db':
                news_to_db.append(tmp_tuple)
                
            else:
                print('\n ----- [ERROR] mode \n')
            
        tmpcnt += 1
        
    ed_time = time.time()
    
    # new data inserted into data storage
    if mode == 'local':
        pickle.dump(local_content, open("./local_content.p", "wb"))
            
    elif mode == 'db':
        
        print(' +++ Inserting news into DB ...', len(news_to_db))
        
        if len(news_to_db) !=0 :
                        
            mongoClient = MongoClient('127.0.0.1', 27017, username = 'CDteam1',\
                                      password = 'sdqy<5q9UW6JDhV', authSource = 'CDteam1DB')
            
            #mongoClient = MongoClient('spaceml4.ethz.ch', 27017, username = 'CDteam1',\
            #                          password = 'sdqy<5q9UW6JDhV', authSource = 'CDteam1DB')
            
            db = mongoClient['CDteam1DB']
            db_collection = db[collection_name]
            db_collection.insert_many(news_to_db)
        
        #db_insert_many(db_collection, news_to_db)
            
    else:
        print('\n ----- [ERROR] mode \n')
    
    # status information materialized 
    pickle.dump(current_day, open("./current_day.p", "wb"))
    pickle.dump(current_news_set, open("./news_set.p", "wb"))
    
    # log
    with open(para_log_file, "a") as text_file:
        text_file.write("amount of news so far today: %d \n"%(len(current_news_set)))
        text_file.write("processing time : %d \n"%(int(ed_time-st_time)))
        
    print('\n Total processing time(sec) of this update:', int(ed_time-st_time))
    print('Amount of news in this update : ', tmpcnt)
    print('Amount of news so far today : ', len(current_news_set), '\n')
    
    
if __name__== "__main__":
    
    '''
    arguments:
    bool_ini: [true, false] initialize the date counter
    mode: [local, db] local file systems or DB
    rss_idx: [0, 1] 0: all , 1: crypto related 
    
    '''
    
    bool_ini = True if sys.argv[1].lower() == 'true' else False
    mode = str(sys.argv[2])
    # local, db
    rss_idx = int(sys.argv[3])
    
    print(type(bool_ini), bool_ini, mode)
    
    if bool_ini == True:
        
        print('\n Initialize ... \n')
        
        current_news_set = set()
        current_day = -1
        
        pickle.dump(current_day, open("./current_day.p", "wb"))
        pickle.dump(current_news_set, open("./news_set.p", "wb"))
        
        if mode == 'local':
            local_content = []
            pickle.dump(local_content, open("./local_content.p", "wb"))
        
    
    rss_collecting_job_entity(para_rss[rss_idx], mode, para_collection_name[rss_idx])
    
    scheduler = BlockingScheduler()
    print('Start to collect RSS feeds at time interval %d minutes'%(para_time_interval))
    scheduler.add_job(lambda:rss_collecting_job_entity(para_rss[rss_idx], mode, para_collection_name[rss_idx]), 
                      'interval', minutes = para_time_interval)
    scheduler.start()
