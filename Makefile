

cd: # karma parameters.json
	@/bin/bash update.sh --dev

cp: # jest parameters.json
	@/bin/bash update.sh --prod

dev:
	yarn dev

build:
	yarn build