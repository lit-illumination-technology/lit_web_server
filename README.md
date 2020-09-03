# LIT Web Server
## Summary
Provides a RESTful interface and webpage to access the features of the LIT daemon.

## Requires
[LIT Daemon](https://github.com/nickpesce/lit)

## Setup
### Configuration
Configuration is done through environment variables.
If `LIT_USER` and `LIT_PASSWORD` are defined, basic authentication will be required.
This should be run with gunicorn

### Installation
1. Go to your home directory
`$ cd`
2. Clone this repository
`$ git clone https://github.com/nickpesce/lit_web_server.git`
3. Install the start script
`$ sudo cp lit_web_server/litwebserver.service /etc/systemd/system`
4. Start and enable the script
`$ sudo systemctl start litwebserver && sudo systemctl enable litwebserver`

## API Requests
All endpoints are prefixed with `/api/v1/`
Method|Endpoint|Request|Response
------|--------|-------|--------
`GET`|`effects`||`{"effects": [{"name": string, "default_speed": number, "schema": schema},]}`
`POST`|`effects/{effect_name}`|`{"args": args, "parameters": parameters}`|`{"code": int, "message": string, "transaction_id": int}`
`DELETE`|`effects`|`{"effect_id": int} \| {"transaction_id": int}`|`{"code": int, "message": string}`
`POST`|`presets/{preset_name}`|`{"parameters": parameters}`|`{"code": int, "message": string, "transaction_id": int}`
`POST`|`history`|`{"back": bool?, "forward": bool?}`|`{"code": int, "message": string}`
`GET`|`colors`||`{"colors": [{"name": string, "rgb": [number, number, number]},]}`
`GET`|`ranges`||`{"sections": [string,], "zones": ["string"]}`


`schema`:
``` javascript
{
  arg_name: {
    "required": boolean,
    "value": {
      "type": color|number
    }
  }
}
```
`color`:
```javascript
{
  "default": [number, number, number],
  "type": "color"
}
```
`number`:
```javascript
{
  "default": number,
  "min": number,
  "max": number,
  "type": "number"
}
```
`args`:
```javascript
{arg_name_1: arg_value_1, arg_name_2: arg_value_2, ...}
```
`parameters`:
```javascript
{"overlayed": boolean?, "opacity": number?, "ranges": [string]?, speed: number?}
```
## FAQ
### How do I access the webpage?
Get the ip address of your raspberry pi (`ip addr`), then in a web browser navigate to that ip address followed by a colon, folowed by the port number specified in the config. If you use port 80, then the colon and port are not required.
### The IP address of my Raspberry Pi keeps changing. How do I tell it to stop?
Like [this](https://thepihut.com/blogs/raspberry-pi-tutorials/16683276-how-to-setup-a-static-ip-address-on-your-raspberry-pi) or [this](https://www.howtogeek.com/184310/ask-htg-should-i-be-setting-static-ip-addresses-on-my-router/)
### How do I connect from outside the network
To control your lights from anywhere, you will need to setup port forwarding on your router. The steps are specific to the router firmware, but you will need to forward the port specified in the config to the ip address of your raspberry pi.
### How do I authenticate with the api?
Authentication is done with http basic authentication. In the request header, set the `Authorization` cookie to `Basic XXX` where `XXX` is username:password in base 64.
### Is this secure?
No. Not at all. If you don't want random internet people intercepting your password and turning on your lights in the middle of the night, you will need to setup https.

## Suggested Integrations
- [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm&hl=en_US) is an android app that allows you to automate tasks. Events can trigger a POST request that turn on/off the lights. Leaving your home wifi can turn the lights off. Your phone's morning alarm can turn the lights on. To set this up the Tasker action is __Net -> Http POST__ and the settings are:
    - __Server:Port__: *username*:*password*@*url*
        - *ex*: nick:hunter2@12.345.6.789
    - __Path__: command/effect
    - __Data/File__: {"name": "*effect*", "args": {...}}
        - *ex*: {"name": "on". "args": {"color": [255, 0, 255]}}
    - __Content Type__: application/json
    - __Trust Any Certificate__: ✓
- Turn off the lights when you turn off or put your computer to sleep. This one is more operating system dependent, but for many linux systems this would involve a systemd service with `WantedBy=sleep.target` and a `curl` request.
