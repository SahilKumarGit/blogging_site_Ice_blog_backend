function decodeBase64Image(dataString) {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.originalname = new Date().getTime() + 'IMG.' + matches[1].split('/')[1];
    response.buffer = new Buffer.from(matches[2], 'base64');

    return response;
}

module.exports = { decodeBase64Image }