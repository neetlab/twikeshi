const Twit = require("twit");
const config = require("./.twikeshirc.json");

class Twikeshi {
  constructor() {
    this.twitter = new Twit({
      consumer_key: config.twitter.consumerKey,
      consumer_secret: config.twitter.consumerSecret,
      access_token: config.twitter.accessToken,
      access_token_secret: config.twitter.accessTokenSecret,
      timeout_ms: 60 * 1000,
      strictSSL: true,
    });
  }

  removeSingleTweet(id) {
    if (config.dryRun) return;
    return this.twitter.post("statuses/destroy/:id", { id });
  }

  fetchUserTweets(screenName, maxId) {
    const opts = { screen_name: screenName };
    if (maxId) opts.max_id = maxId;
    return this.twitter.get("statuses/user_timeline").then((res) => res.data);
  }
}

(async () => {
  const twikeshi = new Twikeshi();
  let maxId = null;

  while (true) {
    const tweets = await twikeshi.fetchUserTweets(config.screenName, maxId);

    if (tweets.length === 0) {
      break;
    }

    for (const tweet of tweets) {
      if (config.excludeIds.includes(tweet.id_str)) {
        console.info(`[Twikeshi] Skipping ${tweet.text}`);
        continue;
      }

      try {
        console.info(`[Twikeshi] Removing ${tweet.text}`);
        await twikeshi.removeSingleTweet(tweet.id_str);
      } catch (error) {
        console.warn(error);
      }
    }

    maxId = tweets[tweets.length - 1].id_str;
  }

  console.info('[Twikeshi] Erasing tweets completed successfully!');
})();
