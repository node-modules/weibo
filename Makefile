TESTS = test/*.js
REPORTER = spec
TIMEOUT = 10000
MOCHA_OPTS =
G = 

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) $(MOCHA_OPTS) \
		$(TESTS)

test-g:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) -g "$(G)" \
		$(TESTS)

test-cov:
	@rm -rf ./lib-cov
	@$(MAKE) lib-cov
	@WEIBO_COV=1 $(MAKE) test
	@WEIBO_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib $@

build:
	./node_modules/browserify/bin/cmd.js examples/browser/entry.js -o examples/browser/bundle.js
	./node_modules/browserify/bin/cmd.js test/browser/entry.js -o test/browser/bundle.js

publish: build
	npm publish

.PHONY: test-cov test test-cov build test-g publish
