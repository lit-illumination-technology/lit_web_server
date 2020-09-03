from functools import wraps
import operator
import os.path
import os
import threading

from flask import Flask, render_template, request, abort, Response, jsonify

import lit

app = Flask(__name__)

username= os.environ.get('LIT_USER')
password= os.environ.get('LIT_PASSWORD')

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
    if username and password:
        return decorated
    else:
        return f

@app.route("/", methods=['GET'])
@requires_auth
def hello():
    return render_template('index.html')

@app.route("/api/v1/effects/<effect_name>", methods=['POST'])
@requires_auth
def command_effect(effect_name):
    effect = request.get_json()
    res = lit.start_effect(effect_name=effect_name,
                           effect_args=effect.get("args", {}),
                           properties=effect.get("properties", {}))
    return jsonify(res)

@app.route("/api/v1/effects", methods=['DELETE'])
@requires_auth
def command_stop():
    selector = request.get_json();
    if "effect_id" in selector:
        res = lit.stop(effect_id=selector["effect_id"])
    elif "transaction_id" in selector:
        res = lit.stop(transaction_id=selector["transaction_id"])
    else:
        return Response("Invalid use of api", 500)
        
    return jsonify(res)

@app.route("/api/v1/presets/<preset_name>", methods=['POST'])
@requires_auth
def command_preset(preset_name):
    preset = request.get_json();
    res = lit.start_preset(preset_name, properties=preset.get("properties", {}))
    return jsonify(res)

@app.route("/api/v1/history", methods=['POST'])
@requires_auth
def history():
    direction = request.get_json()
    if "back" in direction:
        res = lit.back()
    elif "forward" in direction:
        res = lit.forward()
    else:
        return Response('Invalid use of api', 500)
    
    return jsonify(res)

@app.route("/api/v1/effects", methods=['GET'])
def effects():
    return jsonify(effects=sorted(lit.get_effects(), key=operator.itemgetter('name')))

@app.route("/api/v1/presets", methods=['GET'])
def presets():
    return jsonify(presets=sorted(lit.get_presets()))

@app.route("/api/v1/colors", methods=['GET'])
def colors():
    return jsonify(colors=lit.get_colors())

@app.route("/api/v1/ranges", methods=['GET'])
def ranges():
    return jsonify(sections=[k for k in lit.get_sections()], zones=[k for k in lit.get_zones()])

@app.route("/api/v1/speeds", methods=['GET'])
def speeds():
    return jsonify(speeds=lit.get_speeds())

@app.route("/api/v1/pixels", methods=['GET'])
def pixels():
    return jsonify(pixels=lit.get_pixels())

@app.route("/api/v1/state", methods=['GET'])
def state():
    return jsonify(state=lit.get_state())

if __name__ == "__main__":
    app.config['DEBUG'] = True
    app.run(host='0.0.0.0', threaded=True)
