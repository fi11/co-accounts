NODE ?= node

test:
	@$(NODE) ./node_modules/.bin/mocha \
		--reporter spec \
		--slow 2s \
		--harmony-generators \
		--bail
example:
	echo "Run example ..." && node --harmony example/app

.PHONY: test example
