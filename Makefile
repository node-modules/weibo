TESTS = test/*.js
REPORTER = spec
TIMEOUT = 10000
MOCHA_OPTS =
G =
JSCOVERAGE = ./node_modules/jscover/bin/jscover

install:
	@npm install --registry=http://registry.cnpmjs.org --cache=${HOME}/.npm/.cache/cnpm

test: install
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) $(MOCHA_OPTS) \
		$(TESTS)

test-g:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) -g "$(G)" \
		$(TESTS)

test-cov: lib-cov
	@WEIBO_COV=1 $(MAKE) test REPORTER=dot
	@WEIBO_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov: install
	@rm -rf $@
	@$(JSCOVERAGE) lib $@

build:
	./node_modules/browserify/bin/cmd.js examples/browser/entry.js -o examples/browser/bundle.js
	./node_modules/browserify/bin/cmd.js test/browser/entry.js -o test/browser/bundle.js

publish: build
	npm publish

.PHONY: test test-g test-cov lib-cov build publish
