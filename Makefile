.PHONY: init install dev build start lint prisma-generate deploy

init: install prisma-generate

install:
	npm install

dev:
	node node_modules/next/dist/bin/next dev

build:
	node node_modules/next/dist/bin/next build

start:
	node node_modules/next/dist/bin/next start

lint:
	npm run lint

prisma-generate:
	npx prisma generate

deploy:
	git add .
	git commit -m "deploy: $$(date '+%Y-%m-%d %H:%M')"
	git push
