(async function() {
  const resp: {[key: string]: string} = {};
  location.hash.slice(1).split("&").forEach(kv => {
    const [key, val] = kv.split("=");
    resp[key] = decodeURIComponent(val);
  });
  // FIXME Detect close and raise error
  try {
    if (resp.access_token !== undefined) {
      opener.authenticate(resp.access_token, resp.state);
      close();
    } else {
      const error: {[key: string]: string} = {};
      location.search.slice(1).split("&").forEach(kv => {
        const [key, val] = kv.split("=");
        error[key] = decodeURIComponent(val);
      });
      opener.authenticate(undefined, error.state, error.error);
      close();
    }
  } catch (err) {
    // FIXME Notify user
    throw err;
  }
})();
