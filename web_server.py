import argparse
import configparser
from functools import wraps
import operator
import os.path
import threading

from flask import Flask, render_template, request, abort, Response, jsonify

import lit

app = Flask(__name__)

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
    return Response('Incorrect username or password', 401,
                    {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

@app.route("/", methods=['GET'])
@requires_auth
def hello():
    return render_template('index.html')

@app.route("/api/v1/command", methods=['POST'])
@requires_auth
def command():
    json = request.get_json();
    if "effect" in json:
        effect = json["effect"]
        res = lit.start_effect(effect_name=effect["name"],
                               effect_args=effect.get("args", {}),
                               properties=effect.get("properties", {}))
    elif "preset" in json:
        preset = json["preset"]
        res = lit.start_preset(preset["name"], properties=preset.get("properties", {}))
    else:
        return Response('Invalid command type', 500)

    return jsonify(res)

@app.route("/api/v1/query/effects", methods=['GET'])
def effects():
    return jsonify(effects=sorted(lit.get_effects(), key=operator.itemgetter('name')))

@app.route("/api/v1/query/presets", methods=['GET'])
def presets():
    return jsonify(presets=sorted(lit.get_presets()))

@app.route("/api/v1/query/colors", methods=['GET'])
def colors():
    return jsonify(colors=lit.get_colors())

@app.route("/api/v1/query/ranges", methods=['GET'])
def ranges():
    return jsonify(sections=[k for k in lit.get_sections()], zones=[k for k in lit.get_zones()])

@app.route("/api/v1/query/speeds", methods=['GET'])
def speeds():
    return jsonify(speeds=lit.get_speeds())

@app.route("/api/v1/query/pixels", methods=['GET'])
def pixels():
    return jsonify(pixels=lit.get_pixels())

@app.route("/api/v1/query/state", methods=['GET'])
def state():
    return jsonify(state=lit.get_state())

if __name__ == "__main__":
    app.config['DEBUG'] = True
    app.run(host='0.0.0.0', port=port, threaded=True)
