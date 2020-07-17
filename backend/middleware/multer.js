const multer = require('multer')
var storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, '')
  }
})

module.exports = {
  multipleUpload: multer({ storage: storage }).array('file')
}