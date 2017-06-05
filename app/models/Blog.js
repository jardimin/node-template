const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const slug = require('../../public/js/lib/makeslug');

const getTags = tags => tags.join(',');
const setTags = tags => tags.split(',');

const blogSchema = new mongoose.Schema({
  title: { type: String, default: '', trim: true },
  body: { type: String, default: '', trim: true },
  urlized: { type: String, default: '', trim: true },
  user: { type: mongoose.Schema.ObjectId, ref: 'User' },
  tags: { type: [], get: getTags, set: setTags },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

/**
 * Password hash middleware.
 */
blogSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('urlized')) { return next(); }
  this.urlized = slug.format(this.title);
  next();
});

/**
 * Helper method for validating user's password.
 */
blogSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
blogSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

/**
 * Statics
 */

blogSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load(urlized) {
    return this.findOne({ urlized })
      .populate('user', 'name email username')
      .exec();
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @api private
   */

  list(options) {
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};


const User = mongoose.model('User', blogSchema);

module.exports = User;
