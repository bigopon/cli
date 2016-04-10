"use strict";
const Project = require('../project').Project;
const ProjectItem = require('../project-item').ProjectItem;

module.exports = function(choices, rootFolder) {
  let project = new Project(choices, rootFolder);
  project.content = project.root;

  project.addToContent(
    project.src,
    project.tests.add(
      project.unitTests,
      project.e2eTests
    ),
    ProjectItem.jsonObject('package.json', project.package),
    ProjectItem.directory('client_modules').add(
      ProjectItem.resource('require.js', require.resolve('./resources/require.js'))
    ),
    ProjectItem.resource('.editorconfig', require.resolve('./resources/.editorconfig')),
    ProjectItem.resource('.gitignore', require.resolve('./resources/.gitignore')),
    ProjectItem.resource('favicon.ico', require.resolve('./resources/favicon.ico')),
    ProjectItem.resource('index.html', require.resolve('./resources/index.html'))
  );

  //project.addDevDependency('aurelia-tools');

  project.addClientDependency('aurelia-bootstrapper');
  project.addClientDependency('aurelia-fetch-client');
  project.addClientDependency('aurelia-animator-css');

  return project;
};
