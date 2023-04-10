# BeReal Memories

Get notifications with your one year ago memories from BeReal. Inspired by Snapchat Memories.

## Installation

```bash
npm install
npm start
```

My goal was to make this application was to make sure I wasn't storing any user data. If you have any difficulties with the installation, please open an issue. Otherwise, if you find a way to improve the installation process, please open a pull request.

### BeReal Setup

When you start the script, it will prompt for your BeReal login to then be stored in `config.json`. It will first prompt for your phone number, then a code will be sent to your phone. Enter the code and you will be logged in.

### IFTTT Setup

The script will also prompt for your IFTTT Maker key. This is used to send the notifications to your phone. You can find your key [here](https://ifttt.com/maker).

Here's a guide on how to set up IFTTT to send notifications to your phone: [https://sungkhum.medium.com/how-to-easily-push-notifications-to-your-phone-from-a-micropython-device-21d39968e05c](https://sungkhum.medium.com/how-to-easily-push-notifications-to-your-phone-from-a-micropython-device-21d39968e05c)

Here's the settings for the IFTTT applet:

![IFTTT-setup.png](IFTTT-setup.png)

### Imgur Setup

Lastly, the script will prompt for your Imgur client ID and secret, and refresh token. This is used to upload the images to Imgur.

1. You can find your client ID and secret [here](https://api.imgur.com/oauth2/addclient).
2. You can find your refresh token using this URL template: https://api.imgur.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&response_type=token
3. Your refresh token will be in the URL parameters after you authorize the app.

### Heroku Setup

To run the script on Heroku, follow these steps:

1. Create a new app on Heroku.
2. Upload the files to the app.
3. Turn on the `worker` dyno.

## Usage

The script has been set up to be used on Heroku. The index file is set up to be run every day at 8am.

## Resources

- Shoutout to notmarek for the API implementation found in their project [BeFake](https://github.com/notmarek/BeFake).
- Imgur is used to upload the images to the cloud, to then be sent in the IFTTT notification.

## License

[MIT](https://choosealicense.com/licenses/mit/)
