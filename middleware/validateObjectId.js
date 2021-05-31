const mongoose = require('mongoose');
mongoose.set("useFindAndModify", false);

module.exports = function(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(404).send('Invalid ID.');
  
  next();
}