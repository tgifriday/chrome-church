
all: docs readme build

docs: websql.js docs/*
	@docco websql.js

readme: websql.js Readme.md
	@cat websql.js | perl support/readme.pl > README.md

build: websql.js
	@uglifyjs websql.js > websql.min.js
