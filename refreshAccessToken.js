const fetch = require('node-fetch');
const spotify = require('./credentials');

const refreshAccessToken = refreshToken => {
  const url = 'https://accounts.spotify.com/api/token';

  const data = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };

  const str = `Basic ${Buffer.from(
    `${spotify.client_id}:${spotify.client_secret}`
  ).toString('base64')}`;

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Authorization: str,
  };

  const searchParams = new URLSearchParams();

  Object.keys(data).forEach(prop => {
    searchParams.set(prop, data[prop]);
  });

  return fetch(url, {
    method: 'POST',
    headers,
    body: searchParams,
  })
    .then(res => res.json())
    .catch(error => {
      console.log(error);
    });
};

module.exports = refreshAccessToken;
