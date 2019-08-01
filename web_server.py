import argparse
import configparser
from flask import Flask, render_template, request, abort, Response, json, jsonify
from functools import wraps
import operator
import os.path
import threading

import lit

app = Flask(__name__)
app.config['DEBUG'] = False

parser = argparse.ArgumentParser(description='Start the L.I.T. daemon')
parser.add_argument('--config', '-c', dest='base_path', type=str, 
help='specify the configuration directory')
args = parser.parse_args()
config_dir = args.base_path if args.base_path and os.path.isdir(args.base_path) else "/home/pi/.lit/webserver"
print("Using config directory {}".format(config_dir))

config = configparser.ConfigParser()
config.read(os.path.join(config_dir, 'config.ini'))
password = config.get("General", "password")
username = config.get("General", "username")
port = config.getint("General", "port")

def check_auth(un, pw):
    """This function is called to check if a username /
    password combination is valid.
    """
    return un == username and pw == password

def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
    'Incorrect username or password', 401,
    {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

@app.route("/", methods = ['GET'])
@requires_auth
def hello():
    return render_template('index.html')

@app.route("/command", methods = ['POST'])
@requires_auth
def command():
    json = request.get_json();
    if "args" in json:
        res = lit.start_effect(effect=json["effect"], args=json["args"])
    else:
        res = lit.start_effect(effect=json["effect"])
    return jsonify(res)

@app.route("/has_ai", methods = ['GET'])
def has_ai():
    return False

@app.route("/get_effects.json", methods = ['GET'])
def effects():
    return jsonify(effects=sorted(lit.get_effects(), key=operator.itemgetter('name')))

@app.route("/get_colors.json", methods = ['GET'])
def colors():
    return jsonify(colors=lit.get_colors())

@app.route("/get_ranges.json", methods = ['GET'])
def ranges():
    return jsonify(sections=[k for k in lit.get_sections()], zones=[k for k in lit.get_zones()])

@app.route("/get_speeds.json", methods = ['GET'])
def speeds():
    return jsonify(speeds=lit.get_speeds())

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=port, threaded=True)
