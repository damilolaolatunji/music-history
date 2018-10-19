require('dotenv').config({ path: 'variables.env' });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authorizeSpotify = require('./authorizeSpotify');
const getAccessToken = require('./getAccessToken');
const refreshAccessToken = require('./refreshAccessToken');
const getRecentlyPlayed = require('./getRecentlyPlayed');
const Datastore = require('nedb');
const cron = require('node-cron');
const Pusher = require('pusher');

const clientUrl = process.env.CLIENT_URL;

const app = express();

const db = new Datastore();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  encrypted: true,
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/login', authorizeSpotify);
app.get('/callback', getAccessToken, (req, res, next) => {
  db.insert(req.credentials, err => {
    if (err) {
      next(err);
    } else {
      res.redirect(`${clientUrl}/?authorized=true`);
    }
  });
});

app.get('/history', (req, res) => {
  db.find({}, (err, docs) => {
    if (err) {
      throw Error('Failed to retrieve documents');
    }

    const accessToken = docs[0].access_token;
    getRecentlyPlayed(accessToken)
      .then(data => {
        const arr = data.map(e => ({
          played_at: e.played_at,
          track_name: e.track.name,
        }));

        res.json(arr);
      })
      .then(() => {
        cron.schedule('*/5 * * * *', () => {
          getRecentlyPlayed(accessToken).then(data => {
            const arr = data.map(e => ({
              played_at: e.played_at,
              track_name: e.track.name,
            }));

            pusher.trigger('spotify', 'update-history', {
              musicHistory: arr,
            });
          });
        });
      })
      .catch(err => console.log(err));
  });
});

app.set('port', process.env.PORT || 5000);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
