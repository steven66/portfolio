/**
 * Created by andywalpole on 01/04/2014.
 */
/*jshint multistr: true */
'use strict';

angular.module('portfolioApp.directives').directive('blogBlockDirective', [function () {

  return {
    restrict: 'A',
    replace: true,
    scope: {
      blog: '='
    },
    template: '<article>' +
      '<header><a data-ng-href="/#!/blog/{{blog.uniqueId}}/{{blog.url}}"><img data-ng-src="/{{blog.displayImage}}" alt="" /></a></header>' +
      '<section>' +
      '<h3 class="blog-title" data-ng-bind-html="blog.title"></h3>' +
      '<p class="date" data-ng-bind="blog.publishedDate | date"></p>' +
      '<p data-ng-bind-html="blog.contentSnippet"></p> ' +
      '</section>' +
      '<footer>' +
      '<p class="read-more"><a data-ng-href="/#!/blog/{{blog.uniqueId}}/{{blog.url}}" class="underline">Read more...</a></p>' +
      '</footer>' +
      '</article>'
  };

}]);

