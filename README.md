# LIT Web Server
## Summary
Provides a RESTful interface and webpage to access the features of the LIT daemon.

## Requires
[LIT Daemon](https://github.com/nickpesce/lit)

## Configuration
The default configuration file location is `/home/pi/.lit/webserver/config.ini`. This can be changed using the `-c` command line flag. The configuration file must have a "General" section with "username", "password", and "port" values.

Example:
```
[General]
username: my_username
password: my_password
port: 80
```

## API Requests
Method|Endpoint|Request|Response
------|--------|-------|--------
`POST`|`/command`|`{"effect": string, "args": args}`|`{"rc": int, "result": string}`
`GET`|`/get_effects.json`||`{"effects": [{"name": string, "schema": schema},]}`
`GET`|`/get_colors.json`||`{"colors": [{"name": string, "color": [number, number, number]},]}`
`GET`|`/get_ranges.json`||`{"sections": [string,], "zones": ["string"]}`


`schema`:
``` javascript
{
  arg_name: {
    "required": boolean,
    "value": color|number
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
## FAQ
### How do I access the webpage?
Get the ip address of your raspberry pi (`ip addr`), then in a web browser navigate to that ip address followed by a colon, folowed by the port number specified in the config. If you use port 80, then the colon and port are not required.
### How do I connect from outside the network
To control your lights from anywhere, you will need to setup port forwarding on your router. The steps are specific to the router firmware, but you will need to forward the port specified in the config to the ip address of your raspberry pi.
### How do I authenticate with the api?
Authentication is done with http basic authentication. In the request header, set the `Authorization` cookie to `Basic XXX` where `XXX` is username:password in base 64.
### Is this secure?
No. Not at all. If you don't want random internet people intercepting your password and turning on your lights in the middle of the night, you will need to setup https.
