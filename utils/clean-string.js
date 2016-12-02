var sanitizeHTML = require('sanitize-html');

module.exports = (input) => {
  var output = sanitizeHTML(input, {
    allowedTags: []
  });

  if (input !== output) {
    console.log('Input sanitized: ' + input + ' - TO: ' + output);
  }

  return output;
}
