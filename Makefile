TESTS = test/*.js
REPORTER = spec
TIMEOUT = 10000
MOCHA_OPTS =

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) $(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@rm -rf ./lib-cov
	@$(MAKE) lib-cov
	@WEIBO_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib $@

build:
	./node_modules/browserify/bin/cmd.js index.js -o weibo.js

.PHONY: test-cov test test-cov build
