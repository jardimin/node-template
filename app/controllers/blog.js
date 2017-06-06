/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { respond, respondOrRedirect } = require('../utils');

const Blog = mongoose.model('Blog');
const assign = Object.assign;

/**
 * Load
 */
exports.load = async(function* (req, res, next, urlized) {
  try {
    req.blog = yield Blog.load(urlized);
    if (!req.blog) return next(new Error('blog not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */
exports.index = async(function* (req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const _id = req.query.item;
  const limit = 30;
  const options = {
    limit,
    page
  };

  if (_id) options.criteria = { _id };

  const blogs = yield Blog.list(options);
  const count = yield Blog.count();

  respond(res, 'blogs/index', {
    title: 'blogs',
    blogs,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * New blog
 */
exports.new = function (req, res){
  res.render('blogs/new', {
    title: 'New blog',
    blog: new Blog()
  });
};

/**
 * Create an blog
 * Upload an image
 */
exports.create = async(function* (req, res) {
  const blog = new Blog(only(req.body, 'title body tags'));
  blog.user = req.user;
  try {
    yield blog.save();
    respondOrRedirect({ req, res }, `/blog/${blog.urlized}`, blog, {
      type: 'success',
      text: 'Successfully created blog!'
    });
  } catch (err) {
    respond(res, 'blogs/new', {
      title: blog.title || 'New blog',
      errors: [err.toString()],
      blog
    }, 422);
  }
});

/**
 * Edit an blog
 */
exports.edit = function (req, res) {
  res.render('blogs/edit', {
    title: `Edit ${req.blog.title}`,
    blog: req.blog
  });
};

/**
 * Update blog
 */
exports.update = async(function* (req, res) {
  const blog = req.blog;
  assign(blog, only(req.body, 'title body tags'));
  try {
    yield blog.save();
    respondOrRedirect({ res }, `/blog/${blog.urlized}`, blog);
  } catch (err) {
    respond(res, 'blogs/edit', {
      title: `Edit ${blog.title}`,
      errors: [err.toString()],
      blog
    }, 422);
  }
});

/**
 * Show
 */
exports.show = function (req, res) {
  respond(res, 'blogs/show', {
    title: req.blog.title,
    blog: req.blog
  });
};

/**
 * Delete an blog
 */
exports.destroy = async(function* (req, res) {
  yield req.blog.remove();
  respondOrRedirect({ req, res }, '/blog', {}, {
    type: 'info',
    text: 'Deleted successfully'
  });
});

