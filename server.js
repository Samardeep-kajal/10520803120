const express = require("express");
const dotenv = require("dotenv").config();
const app = express();
const fetch = require("node-fetch");
const nodeCache = require("node-cache");

const bearerToken = `${process.env.BEARER}`;
const cache = new nodeCache();

async function fetchAccessToken() {
  const url = "http://20.244.56.144/train/auth";
  const clientId = `${process.env.CLIENT_ID}`;
  const clientSecret = `${process.env.CLIENT_SECRET}`;

  const authHeaders = {
    Authorization: `Bearer ${bearerToken}`,
  };

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  return data.access_token;
}

async function fetchPostsFromExternalAPI() {
  let accessToken = cache.get("access_token");
  let tokenExpiration = cache.get("expires_in");

  if (!accessToken || Date.now() >= tokenExpiration) {
    accessToken = await fetchAccessToken();
    tokenExpiration = Date.now() + 3600000;
    cache.set(
      "access_token",
      accessToken,
      Math.floor((tokenExpiration - Date.now()) / 1000)
    );
    cache.set(
      "token_expiration",
      tokenExpiration,
      Math.floor((tokenExpiration - Date.now()) / 1000)
    );
  }

  const url = "http://20.244.56.144/train/trains";

  const authHeaders = {
    Authorization: `Bearer ${bearerToken}`,
  };

  const response = await fetch(url, {
    headers: authHeaders,
  });

  const data = await response.json();
  return data;
}

app.get("/train/trains", async (req, res) => {
  try {
    const data = await fetchPostsFromExternalAPI();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));
