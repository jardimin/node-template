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
 * Validations
 */

blogSchema.path('title').validate({
  isAsync: true,
  validator(title, fn) {
    const Blog = mongoose.model('Blog');

    // Check only when it is a new user or when email field is modified
    if (this.isNew || this.isModified('title')) {
      Blog.find({ title }).exec((err, blog) => {
        fn(!err && blog.length === 0);
      });
    } else fn(true);
  },
  message: 'Ja existe um blog com esse titulo.'
});

/**
 * Urlize title.
 */
blogSchema.pre('save', function save(next) {
  const blog = this;
  if (!blog.isModified('title')) { return next(); }
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


const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
