chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('month.html', {
    'bounds': {
      'width': 800,
      'height': 600
    }
  });
});
