# Crypto news from Twitter stream


## Environment

## Google Cloud Platform

We have one instance of Google Cloud Platform machine that hosts a web server. Installation and setup instructions are the following.

* Generate public/private key pair:
	```
	ssh-keygen -t rsa -f ~/.ssh/cdteam1 -C cdteam1
	```

* Change permissions:
	```
	chmod 400 cdteam1
	```

* Send the public key "cdteam1.pub" to server administrator. You can now establish a ssh connection to server through the public key authentification:
	```
	ssh -i cdteam1 cdteam1@[ip address of the machine]
	```

### Migrating Twitter streaming analysis from AWS EC2 to GCP:

* On AWS EC2 machine, create a specification list for the Anaconda environment:
  ```
  source activate ds3
  conda list --explicit > ds3-requirements.txt
  ```

* You can now create and identical Anaconda environment on another (linux-64) machine, for example on GCP:
  ```
  conda create --name ds3 --file ds3-requirements.txt
  ```

* If an environment already exists you can instead just install all the needed packages:
  ```
  conda install --name ds3 --file ds3-requirements.txt 
  ```

* However, for some reason some libraries are still missing so you have to install them manually:
  ```
  conda install -c anaconda pymongo
  conda install -c conda-forge tweepy 
  python -m spacy download en
  ```

* Also, download needed lexicons for `nltk`:
  ```
  > python3
  >>> import nltk
  >>> nltk.download('vader_lexicon')
  ```

## Amazon Web Services

We have one instance of AWS EC2 machine of type m5.4xlarge with 64 GB of RAM memory and 2TB of HDD mounted to `/data`. Spark and MongoDB are already installed on the instance. The instance will be deleted after the datathon, so should not be used for permanent data storage, only processing!

* In order to connect to it follow the same procedure as for GCP platform. Then you can establish the ssh connection to the EC2 machine:
	```
	ssh -i CDteam1.pem ubuntu@[hostname identifier of your machine].compute-1.amazonaws.com
	```

* Once you connect to EC2 you can connect to MongoDB database on the spaceml4 machine (exit with `quit()`).
	```
	mongo  spaceml4.ethz.ch/CDteam1DB -u "CDteam1" -p "[password]" --authenticationDatabase "CDteam1DB"
	```

### Jupyter Notebook on AWS EC2

First, install and setup Anaconda.

* Install Anaconda:
  ```
  mkdir env
  cd env
  curl -O https://repo.anaconda.com/archive/Anaconda3-5.2.0-Linux-x86_64.sh
  bash Anaconda3-5.2.0-Linux-x86_64.sh
  ```
* Create conda environemnt with name `ds3` and update jupyter :
  ```
  conda create -n ds3 anaconda
  source activate ds3
  pip install msgpack
  pip install -U jupyter
  ```
* Install other needed Python packages with `pip` or `conda`.

Second, setup Jupyter Server.

* Create certificates:
  ```
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cdt2_jupyter_cert.key -out cdt2_jupyter_cert.pem
  ```
* Configure Jupyter server:
   ```
  jupyter notebook --generate-config
  jupyter notebook password
  nano /home/ubuntu/.jupyter/jupyter_notebook_config.json
  ```
* The contents of the `jupyter_notebook_config.json` is:
  ```
  {
  "NotebookApp": {
    "certfile": "/path_to/cdt2_jupyter_cert.pem",
    "password": "sha1:[hash of your password]"
    "keyfile": "/path_to/cdt2_jupyter_cert.key",
    "ip": "[hostname identifier of your machine].compute-1.amazonaws.com",
    "port": 9999,
    "open_browser": false
    }
  }
  ```
* Run Jupyter server, preferably in a separate screen:
  ```
  screen -S jupyter
  source activate ds3
  nohup jupyter notebook
  ```
* You can detach the screen with `Ctrl-A-D` shortcut, and reattach on the screen with:
   ```
   screen -r jupyter
   ```

Connect to Jupyter notebook.

* Create SSH tunnel
  ```
  ssh -i /path_to/CDteam2.pem -N -f -L localhost:9999:localhost:9999 ubuntu@[hostname identifier of your machine].compute-1.amazonaws.com
  ```

* Open `https://localhost:9999/` in browser. The password is the one you defined with the `jupyter notebook password` command.
 
Run Twitter streamer.

* Fill in the credentials for Twitter API
  ```
  cp config/test_config.ini config.ini
  nano config/config.ini
  ```

* Run `tweepy_stream.py`
  ```
  screen -S tweepy
  source activate ds3
  python3 tweepy_stream.py
  ```  
 
