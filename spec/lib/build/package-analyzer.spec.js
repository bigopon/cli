'use strict';
const path = require('path');
const PackageAnalyzer = require('../../../lib/build/package-analyzer').PackageAnalyzer;

describe('The PackageAnalyzer', () => {
  let mockfs;
  let project;
  let sut;

  beforeEach(() => {
    mockfs = require('mock-fs');

    project = {
      paths: {
        root: './src/'
      }
    };

    sut = new PackageAnalyzer(project);

    const fsConfig = {};
    mockfs(fsConfig);
  });

  afterEach(() => {
    mockfs.restore();
  });

  it('sets source to npm when node_modules is found in the path', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ }';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../node_modules/my-package',
      main: 'index'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('npm');
        expect(description.loaderConfig).toEqual(loaderConfig);
        done();
      })
      .catch(e => done.fail(e));
  });

  it('sets path and main when path and main are present, cleanup main extname', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ }';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../node_modules/my-package/foo/bar',
      main: 'index.min.js'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('npm');
        expect(description.loaderConfig).toEqual({
          name: 'my-package',
          path: '../node_modules/my-package/foo/bar',
          main: 'index.min'
        });
        done();
      })
      .catch(e => done.fail(e));
  });

  it('sets source to npm, setup main and path, when path is missing', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{}';
    fsConfig[path.join('node_modules/my-package', 'index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package'
    };

    let expectedLoaderConfig = {
      name: 'my-package',
      main: 'index',
      path: '../node_modules/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('npm');
        expect(description.loaderConfig).toEqual(expectedLoaderConfig);
        done();
      })
      .catch(e => done.fail(e));
  });

  it('sets source to npm, setup deep main and path when path is missing', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{"main": "dist/commonjs/index.js"}';
    fsConfig[path.join('node_modules/my-package', 'dist/commonjs/index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package'
    };

    let expectedLoaderConfig = {
      name: 'my-package',
      main: 'dist/commonjs/index',
      path: '../node_modules/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('npm');
        expect(description.loaderConfig).toEqual(expectedLoaderConfig);
        done();
      }).catch(e => done.fail(e));
  });

  it('sets source to npm, setup deep main when main is missing', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package2', 'package.json')] = '{"main": "dist/commonjs/index.js"}';
    fsConfig[path.join('node_modules/my-package2', 'dist/commonjs/index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../node_modules/my-package2'
    };

    let expectedLoaderConfig = {
      name: 'my-package',
      main: 'dist/commonjs/index',
      path: '../node_modules/my-package2'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('npm');
        expect(description.loaderConfig).toEqual(expectedLoaderConfig);
        done();
      }).catch(e => done.fail(e));
  });

  it('sets source to custom when node_modules is not found in the path', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('some-folder/my-package', 'package.json')] = '{ }';
    fsConfig[path.join('some-folder/my-package', 'index.js')] = 'some content';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../some-folder/my-package',
      packageRoot: '../some-folder/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('custom');
        expect(description.loaderConfig).toEqual(Object.assign({main: 'index'}, loaderConfig));
        done();
      })
      .catch(e => done.fail(e));
  });

  it('sets source to custom when node_modules is found in the path, but packageRoot is set', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ }';
    fsConfig[path.join('node_modules/my-package', 'index.js')] = 'some content';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../node_modules/my-package',
      packageRoot: '../node_modules/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('custom');
        expect(description.loaderConfig).toEqual(Object.assign({main: 'index'}, loaderConfig));
        done();
      })
      .catch(e => done.fail(e));
  });

  it('sets source to custom when node_modules is not found in the path, and packageRoot is missing', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('some-folder/my-package', 'package.json')] = '{ }';
    fsConfig[path.join('some-folder/my-package', 'index.js')] = 'some content';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../some-folder/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('custom');
        expect(description.loaderConfig).toEqual(Object.assign({main: 'index'}, {
          name: 'my-package',
          path: '../some-folder/my-package',
          packageRoot: '../some-folder/my-package'
        }));
        done();
      }).catch(e => done.fail(e));
  });

  it('creates description when there is no package.json', done => {
    const fsConfig = {};
    fsConfig[path.join('some-folder/my-package', 'index.js')] = 'some content';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../some-folder/my-package',
      packageRoot: '../some-folder/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('custom');
        expect(description.loaderConfig).toEqual(Object.assign({main: 'index'}, loaderConfig));
        done();
      })
      .catch(e => done.fail(e));
  });

  it('creates description when main is not defined, but with path pointing to single file', done => {
    const fsConfig = {};
    fsConfig[path.join('some-folder/my-package', 'index.js')] = 'some content';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../some-folder/my-package/foo/bar',
      packageRoot: '../some-folder/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('custom');
        expect(description.loaderConfig).toEqual({
          name: 'my-package',
          path: '../some-folder/my-package',
          main: 'foo/bar',
          packageRoot: '../some-folder/my-package'
        });
        done();
      })
      .catch(e => done.fail(e));
  });

  it('creates description when main is not defined, when packageRoot is missing, but with path pointing to single file', done => {
    const fsConfig = {};
    fsConfig[path.join('some-folder/my-package', 'foo/bar.js')] = 'some content';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../some-folder/my-package/foo/bar'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.source).toBe('custom');
        expect(description.loaderConfig).toEqual({
          name: 'my-package',
          path: '../some-folder/my-package/foo',
          main: 'bar',
          packageRoot: '../some-folder/my-package/foo'
        });
        done();
      })
      .catch(e => done.fail(e));
  });

  it('reads package.json as package metadata', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('some-folder/my-package', 'package.json')] = '{ "name": "my-package" }';
    fsConfig[path.join('some-folder/my-package', 'index.js')] = 'some content';
    mockfs(fsConfig);

    let loaderConfig = {
      name: 'my-package',
      path: '../some-folder/my-package',
      packageRoot: '../some-folder/my-package'
    };

    sut.reverseEngineer(loaderConfig)
      .then(description => {
        expect(description.metadata.name).toBe('my-package');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() reads package.json as package metadata', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ "name": "my-package", "main": "index.js" }';
    fsConfig[path.join('node_modules/my-package', 'index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.metadata.name).toBe('my-package');
        expect(description.loaderConfig.path).toBe('../node_modules/my-package');
        expect(description.loaderConfig.main).toBe('index');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() reads package.json as package metadata, respect browser field', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ "name": "my-package", "main": "index.js", "browser": "browser.js" }';
    fsConfig[path.join('node_modules/my-package', 'index.js')] = 'some-content';
    fsConfig[path.join('node_modules/my-package', 'browser.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.metadata.name).toBe('my-package');
        expect(description.loaderConfig.path).toBe('../node_modules/my-package');
        expect(description.loaderConfig.main).toBe('browser');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() supports parent node_modules folder', done => {
    // setup mock package.json
    const fsConfig = {};

    // local node_modules
    fsConfig['node_modules/ignore'] = '';
    // parent node_modules
    fsConfig[path.join('../node_modules/my-package', 'package.json')] = '{ "name": "my-package", "main": "index.js" }';
    fsConfig[path.join('../node_modules/my-package', 'index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.metadata.name).toBe('my-package');
        expect(description.loaderConfig.path).toBe('../../node_modules/my-package');
        expect(description.loaderConfig.main).toBe('index');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() reads package.json as package metadata with implicit /index.js in main path', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ "name": "my-package", "main": "./lib" }';
    fsConfig[path.join('node_modules/my-package/lib', 'index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.metadata.name).toBe('my-package');
        expect(description.loaderConfig.main).toBe('lib/index');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() reads package.json as package metadata with explicit /index.js in main path', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ "name": "my-package", "main": "lib/index.js" }';
    fsConfig[path.join('node_modules/my-package/lib', 'index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.metadata.name).toBe('my-package');
        expect(description.loaderConfig.main).toBe('lib/index');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() determines loaderConfig', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ "name": "my-package", "main": "./foo.js" }';
    fsConfig[path.join('node_modules/my-package', 'foo.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.loaderConfig.name).toBe('my-package');
        expect(description.loaderConfig.path).toBe(path.join('..', 'node_modules', 'my-package'));
        expect(description.loaderConfig.main).toBe('foo');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() determines loaderConfig for deep main', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package', 'package.json')] = '{ "name": "my-package", "main": "dist/commonjs/foo.js" }';
    fsConfig[path.join('node_modules/my-package', 'dist/commonjs/foo.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.loaderConfig).toEqual({
          name: 'my-package',
          path: '../node_modules/my-package',
          main: 'dist/commonjs/foo'
        });
        done();
      })
      .catch(e => done.fail(e));
  });

  it('infers index.js as main file where package.json has no main property', done => {
    // setup mock package.json
    const fsConfig = {};
    let json = '{ "name": "my-package" }';
    fsConfig[path.join('node_modules/my-package', 'package.json')] = json;
    fsConfig[path.join('node_modules/my-package', 'index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(description => {
        expect(description.loaderConfig.name).toBe('my-package');
        expect(description.loaderConfig.path).toBe(path.join('..', 'node_modules', 'my-package'));
        expect(description.loaderConfig.main).toBe('index');
        done();
      })
      .catch(e => done.fail(e));
  });

  it('analyze() rejects when there is no package.json.', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules/my-package')] = {};
    fsConfig[path.join('node_modules/my-package', 'index.js')] = 'some-content';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    sut.analyze('my-package')
      .then(() => {
        done.fail('should not pass');
      })
      .catch(e => {
        expect(e.message).toBe('Unable to find package metadata (package.json) of my-package');
        done();
      });
  });

  it('analyze() throws error when main file does not exist', done => {
    // setup mock package.json
    const fsConfig = {};
    fsConfig[path.join('node_modules', 'my-package', 'package.json')] = '{ "main": "foo.js" }';
    fsConfig[project.paths.root] = {};
    mockfs(fsConfig);

    let p = path.resolve(path.join('node_modules', 'my-package', 'foo.js'));

    sut.analyze('my-package')
      .then(() => done.fail('should have thrown an exception'))
      .catch(e => {
        expect(e.message).toBe(`The "my-package" package references a main file that does not exist: ${p}`);
        done();
      });
  });
});
