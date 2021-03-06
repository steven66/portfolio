/**
 * Created by awalpole on 19/04/2014.
 */
'use strict';

var gfeed = require('google-feed-api');
var _ = require('underscore');
var q = require('q');
var Blog = require('../routes/models/blog_model');
var moment = require('moment');
var fs = require('fs');

var _sortOldBlogPosts;
var _totalArticlesCount;
var _seoFriendly;
var _addReviewImage;
var _newBlogPosts;
var _mergeBlogPosts;
var _closeBlogComments;

/** Simple getter setter cache class
 * **/
var BlogCacheClass = function (val) {

  var value = val;

  Object.defineProperty(this, 'cache', {
    get: function () {
      return value;
    },
    set: function (val) {
      value = val;
    }
  });

};

var OldBlogPosts = new BlogCacheClass();
var OldBlogPostTotal = new BlogCacheClass();

var createJSONFile = function() {

  if(OldBlogPosts.cache) {

    fs.writeFile('./server/blogposts.json', OldBlogPosts.cache, function (err) {
      if (err) {
        return console.log(err);
      }
    });

  }

};

var RSSClass = function () {

  /** Set defaults
   * Will come in handy to use later for getters setters or other requirements if needed
   * **/
  Object.defineProperty(this, 'blogs', {
    value: {}
  });
  Object.defineProperty(this, 'blogs.totalArticles', {
    value: null,
    writable: true
  });
  Object.defineProperty(this, 'blogs.BlogPosts', {
    value: null,
    writable: true
  });
  Object.defineProperty(this, 'totalNewArticles', {
    value: null,
    writable: true
  });
  Object.defineProperty(this, 'totalOldArticles', {
    value: null,
    writable: true
  });
  Object.defineProperty(this, 'oldBlogPosts', {
    value: null,
    writable: true
  });

  /** 1. Create the right date format
   *  2. Using the date create a unique ID for the blog post which is used in the URL
   * **/
  _sortOldBlogPosts = function () {

    var posts = this.oldBlogPosts;

    Object.keys(posts).forEach(function (key) {

      if (posts[key].publishedDate) {

        var newDate;

        if (posts[key].publishedDate.match(/[a-zA-Z]/g)) {

          newDate = moment(posts[key].publishedDate).valueOf();

        } else {

          newDate = posts[key].publishedDate;

        }

        // use moment().valueOf() so that the value is in milliseconds
        // the inbuilt angular filter date will format it to something easily understood
        posts[key].publishedDate = newDate.toString();

        // create a unique ID from the date which is used in the URL
        // when the individual blog post is loaded it is used to retrieve
        // the item from the article data array
        posts[key].uniqueId = newDate.toString().substring(0, 6);

      }

    });

  }.bind(this);


  /** Count the total number of blog posts
   * **/
  _totalArticlesCount = function () {

    var defer = q.defer();

    this.blogs.totalArticles = this.totalOldArticles + this.totalNewArticles;

    // new pass in the promise the blog posts ready to send to the browser
    defer.resolve(this.blogs);

    return this.blogs;

  }.bind(this);


  /** create SEO friendly URL from title and add it to the scope
   * **/
  _seoFriendly = function () {

    var data = this.oldBlogPosts;

    // in this array are a liist of stopwords which have less SEO value
    var stopwords = ['a', 'about', 'above', 'across', 'after', 'afterwards', 'again', 'against', 'all', 'almost', 'alone', 'along', 'already', 'also', 'although', 'always', 'am', 'among', 'amongst', 'amoungst', 'amount', 'an', 'and', 'another', 'any', 'anyhow', 'anyone', 'anything', 'anyway', 'anywhere', 'are', 'around', 'as', 'at', 'back', 'be', 'became', 'because', 'become', 'becomes', 'becoming', 'been', 'before', 'beforehand', 'behind', 'being', 'below', 'beside', 'besides', 'between', 'beyond', 'bill', 'both', 'bottom', 'but', 'by', 'call', 'can', 'cannot', 'cant', 'co', 'con', 'could', 'couldnt', 'cry', 'de', 'describe', 'detail', 'do', 'done', 'down', 'due', 'during', 'each', 'eg', 'eight', 'either', 'eleven', 'else', 'elsewhere', 'empty', 'enough', 'etc', 'even', 'ever', 'every', 'everyone', 'everything', 'everywhere', 'except', 'few', 'fifteen', 'fify', 'fill', 'find', 'fire', 'first', 'five', 'for', 'former', 'formerly', 'forty', 'found', 'four', 'from', 'front', 'full', 'further', 'get', 'give', 'go', 'had', 'has', 'hasnt', 'have', 'he', 'hence', 'her', 'here', 'hereafter', 'hereby', 'herein', 'hereupon', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'however', 'hundred', 'ie', 'if', 'in', 'inc', 'indeed', 'interest', 'into', 'is', 'it', 'its', 'itself', 'keep', 'last', 'latter', 'latterly', 'least', 'less', 'ltd', 'made', 'many', 'may', 'me', 'meanwhile', 'might', 'mill', 'mine', 'more', 'moreover', 'most', 'mostly', 'move', 'much', 'must', 'my', 'myself', 'name', 'namely', 'neither', 'never', 'nevertheless', 'next', 'nine', 'no', 'nobody', 'none', 'noone', 'nor', 'not', 'nothing', 'now', 'nowhere', 'of', 'off', 'often', 'on', 'once', 'one', 'only', 'onto', 'or', 'other', 'others', 'otherwise', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'part', 'per', 'perhaps', 'please', 'put', 'rather', 're', 'same', 'see', 'seem', 'seemed', 'seeming', 'seems', 'serious', 'several', 'she', 'should', 'show', 'side', 'since', 'sincere', 'six', 'sixty', 'so', 'some', 'somehow', 'someone', 'something', 'sometime', 'sometimes', 'somewhere', 'still', 'such', 'system', 'take', 'ten', 'than', 'that', 'the', 'their', 'them', 'themselves', 'then', 'thence', 'there', 'thereafter', 'thereby', 'therefore', 'therein', 'thereupon', 'these', 'they', 'thickv', 'thin', 'third', 'this', 'those', 'though', 'three', 'through', 'throughout', 'thru', 'thus', 'to', 'together', 'too', 'top', 'toward', 'towards', 'twelve', 'twenty', 'two', 'un', 'under', 'until', 'up', 'upon', 'us', 'very', 'via', 'was', 'we', 'well', 'were', 'what', 'whatever', 'when', 'whence', 'whenever', 'where', 'whereafter', 'whereas', 'whereby', 'wherein', 'whereupon', 'wherever', 'whether', 'which', 'while', 'whither', 'who', 'whoever', 'whole', 'whom', 'whose', 'why', 'will', 'with', 'within', 'without', 'would', 'yet', 'you', 'your', 'yours', 'yourself', 'yourselves', 'the'];

    var oldPosts = data;
    var regexNonAlphaNum = /[^\-a-z0-9]/g;
    var regexWhiteSpace = /\s/gi;
    var x;
    var l;
    var newTitle;

    Object.keys(oldPosts).forEach(function (key) {

      if (oldPosts[key].title) {

        // initially remove hyphens and the white space to their right
        newTitle = oldPosts[key].title.replace(/\–\s/g, '').toLowerCase();

        x = 0;
        l = stopwords.length;

        // loop through the SEO watch words and replace with white space hyphen
        do {

          var regEx = new RegExp('\\b\\s' + stopwords[x] + '\\s\\b', 'g');
          var regExTwo = new RegExp('^' + stopwords[x] + '\\s\\b');

          newTitle = newTitle.replace(regEx, '-').trim().replace(regExTwo, '');

          x += 1;

        } while (x < l);

        // remove white space and replace with hythen
        newTitle = newTitle.replace(regexWhiteSpace, '-');
        // remove all non-alpha numeric characters
        newTitle = newTitle.replace(regexNonAlphaNum, '');

        // now there is an SEO friendly URN fragment available for use
        oldPosts[key].url = newTitle;

      }

    });

  }.bind(this);


  /**
   // these are the images that appear at the top of every blog post
   // at the time of writing there are ten different images
   * **/
  _addReviewImage = function () {

    var oldPosts = this.blogs.BlogPosts;
    var numImages = _.size(this.BLOG);
    var imageArray = _.toArray(this.BLOG);

    var x = -1;

    Object.keys(oldPosts).forEach(function (key) {

      if (x === (numImages - 1)) {
        x = -1;
      }

      if(!oldPosts[key].displayImage) {

        oldPosts[key].displayImage = imageArray[(x += 1)];

      }

    });

    this.blogs.BlogPosts = oldPosts;

  }.bind(this);


  /** Retrieve all new blog posts and pass on in the function promise
   * **/
  _newBlogPosts = function () {

    var defer = q.defer();

    // use mongoose to get all blogs in the database
    Blog.find(function (err, blogs) {

      // if there is an error retrieving, send the error. nothing after res.send(err) will execute
      if (err) {
        return new Error(err);
      }

      this.totalNewArticles = _.size(blogs);

      defer.resolve(blogs);

    }.bind(this));

    return defer.promise;

  }.bind(this);


  /** Merge old and new posts. This is what will be provided to teh frontend
   * **/
  _mergeBlogPosts = function (data) {

    this.blogs.BlogPosts = _.union(data, this.oldBlogPosts);

  }.bind(this);


  /** For old blog posts taken from Suburban Glory keep comments closed
   * **/
  _closeBlogComments = function () {

    var oldPosts = this.oldBlogPosts;

    Object.keys(oldPosts).forEach(function (key) {

      oldPosts[key].commentsOpen = false;

    });

  }.bind(this);

};

/** If the old blog posts are cached the just run the functions used for the new blog posts
 * **/

RSSClass.prototype.blogItems = function (callback) {

  // retrieve the cache
  this.oldBlogPosts = JSON.parse(OldBlogPosts.cache);
  this.totalOldArticles = JSON.parse(OldBlogPostTotal.cache);

  q.fcall(_newBlogPosts)
    .then(_mergeBlogPosts)
    .then(_addReviewImage)
    .then(_totalArticlesCount)
    .then(function (data) {

      callback(data);

    }).done();
};


RSSClass.prototype.parseFeed = function (url, callback) {

  var feed = new gfeed.Feed(url);

  feed.setNumEntries(50);
  feed.load(function (data) {

    /** After retrieving data using Google RSS API store it into the cache and count number of old blog posts
     * **/
    if (data.error || !data) {
      return new Error('Error fetching feeds');
    }

    this.totalOldArticles = _.size(data.feed.entries);
    // if empty provide value of empty object to see if it stops nasty JS errors appearing
    this.oldBlogPosts = data.feed.entries || {};

    /** use promises to filter and sort old and new blogs
     * These don't need to be chained together in synchronous order
     * Call new blogs in tandem with parsing the RSS feed of the old blog posts
     * **/
    q.fcall(function () {
      _sortOldBlogPosts();
      _seoFriendly();
      _closeBlogComments();
    }).then(_newBlogPosts)
      .then(_mergeBlogPosts)
      .then(_addReviewImage)
      .then(_totalArticlesCount)
      .then(function (data) {

        // set cache here
        // cache old RSS feed and data
        OldBlogPosts.cache = JSON.stringify(this.oldBlogPosts);
        OldBlogPostTotal.cache = JSON.stringify(this.totalOldArticles);

        callback(data);

      }.bind(this)).done();

  }.bind(this));

};


module.exports = function (app) {

  app.get('/api/oldBlog/get', function (req, res) {

    var OldBlogFeed = new RSSClass();

    Object.defineProperty(OldBlogFeed, 'RSSFeed', {
      value: req.query.RSSFeed
    });

    Object.defineProperty(OldBlogFeed, 'BLOG', {
      value: JSON.parse(req.query.BLOG)
    });

    createJSONFile();

    // if oldBlogPosts are in the cache then don't use the parseFeed method
    // just retrieve them from the cache
    if (OldBlogPosts.cache && OldBlogPostTotal.cache) {

      OldBlogFeed.blogItems(function (data) {

        res.json(data);

      });

    } else {

      OldBlogFeed.parseFeed(OldBlogFeed.RSSFeed, function (data) {

        res.json(data);

      });

    }

  });

};