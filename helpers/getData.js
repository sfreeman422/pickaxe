const axios = require("axios");
/**
 *
 * Gets data from the provided url.
 *
 * @param {string} url
 */
function getData(url) {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then(response => resolve(response.data))
      .catch(e => reject(e));
  });
}

module.exports = getData;
