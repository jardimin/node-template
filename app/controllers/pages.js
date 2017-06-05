/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('pages/home', {
    title: 'Home'
  });
};
