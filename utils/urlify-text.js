module.exports = (input) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return input.replace(urlRegex, (url) => {

    if (url.match(/\.(jpeg|jpg|gif|png)$/) !== null) {
      return `<img src=" ${ url }" />`;
    }

    return `<a href=" ${ url }" target="_blank">${ url }</a>`;
  });
}
