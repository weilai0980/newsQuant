import configparser
import os

class ConfigFileAccessError(Exception):
    pass

def fileexists(CONFIGFILE):
    return(os.path.isfile(CONFIGFILE) )

def get_config(file_path):
    """ Load parameter and configuration values from the CONFIGFILE
        Write the configure parameters here!!
    """
    # print ("hello..hello")

    CONFIGFILE = file_path 

    Config = configparser.ConfigParser()

    config = {}   # Dictionary of "section" keys.  Each value is a sub-dict of key-vals
    if fileexists(CONFIGFILE):
        Config.read(CONFIGFILE)
        for section in Config.sections():
            # print (section)
            subdict = {}
            options = Config.options(section)
            for option in options:
                key = option
                val = Config.get(section,option)

                subdict[option] = Config.get(section,option)

            config[section] = subdict

    else:
        raise ConfigFileAccessError(CONFIGFILE)

    return config