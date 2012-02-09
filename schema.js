var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var User = new Schema({
    username: { type: String, index: true, required: true }
  , first_name: { type: String }
  , last_name: { type: String }
  , password: { type: String, required: true }
  , salt: { type: String, required: true }
  , email: { type: String, required: true, index: { unique: true, sparse: true } }
  , is_active: { type: Boolean, default: false }
  , is_staff: { type: Boolean, default: false }
  , is_superuser: { type: Boolean, default: false }
  , date_joined: { type: Date }
  , last_login: { type: Date }
});

mongoose.model('User', User);
